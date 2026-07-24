import type { MapBounds } from '@osm-editor-kit/osm-data'
import area from '@turf/area'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import difference from '@turf/difference'
import flatten from '@turf/flatten'
import { featureCollection } from '@turf/helpers'
import intersect from '@turf/intersect'
import union from '@turf/union'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'

export const BUFFER_PX_AT_Z13 = 200
export const BUFFER_PX_AT_Z17 = 350
export const MIN_MISSING_AREA_RATIO = 0.005
export const FULL_FETCH_RATIO = 0.85
export const MAX_STRIP_REQUESTS = 2
export const MAX_HISTORY_FEATURES = 40
export const MAX_HISTORY_GROUPS = 20

const HIGH_FILL_RATIO = 0.7

export type MapSizePx = {
  width: number
  height: number
}

export type CoverageFetchKind = 'initial' | 'strip' | 'full'

export type CoverageFetchRequest = {
  bounds: MapBounds
  kind: CoverageFetchKind
}

export type CoverageFetchProps = {
  groupId: string
  fetchedAt: string
  requestIndex: number
  requestCount: number
  kind: CoverageFetchKind
}

export function emptyFetchHistory(): FeatureCollection<Polygon, CoverageFetchProps> {
  return { type: 'FeatureCollection', features: [] }
}

export function bufferPxAtZoom(zoom: number): number {
  return BUFFER_PX_AT_Z13 + 37.5 * (zoom - 13)
}

export function boundsToPolygon(bounds: MapBounds): Feature<Polygon> {
  return bboxPolygon([bounds.west, bounds.south, bounds.east, bounds.north])
}

export function polygonToBounds(feature: Feature<Polygon | MultiPolygon>): MapBounds {
  const [west, south, east, north] = bbox(feature)
  return { west, south, east, north }
}

export function isValidBounds(bounds: MapBounds): boolean {
  return bounds.west < bounds.east && bounds.south < bounds.north
}

export function boundsArea(bounds: MapBounds): number {
  return area(boundsToPolygon(bounds))
}

export function bufferBoundsInViewport(
  request: MapBounds,
  viewport: MapBounds,
  zoom: number,
  mapSizePx: MapSizePx,
): MapBounds {
  const px = bufferPxAtZoom(zoom)
  const lonBuffer = (px * (viewport.east - viewport.west)) / mapSizePx.width
  const latBuffer = (px * (viewport.north - viewport.south)) / mapSizePx.height

  return {
    west: request.west - lonBuffer,
    south: request.south - latBuffer,
    east: request.east + lonBuffer,
    north: request.north + latBuffer,
  }
}

export function clampBoundsToViewport(request: MapBounds, viewport: MapBounds): MapBounds {
  return {
    west: Math.max(request.west, viewport.west),
    south: Math.max(request.south, viewport.south),
    east: Math.min(request.east, viewport.east),
    north: Math.min(request.north, viewport.north),
  }
}

function prepareFetchBounds(
  request: MapBounds,
  viewport: MapBounds,
  zoom: number,
  mapSizePx: MapSizePx,
): MapBounds | null {
  const buffered = clampBoundsToViewport(
    bufferBoundsInViewport(request, viewport, zoom, mapSizePx),
    viewport,
  )
  if (!isValidBounds(buffered)) return null

  const viewportArea = boundsArea(viewport)
  if (boundsArea(buffered) < MIN_MISSING_AREA_RATIO * viewportArea) return null

  return buffered
}

function missingParts(
  viewport: MapBounds,
  coverage: Feature<Polygon | MultiPolygon>,
): Feature<Polygon>[] {
  const viewportPoly = boundsToPolygon(viewport)
  const missing = difference(featureCollection([viewportPoly, coverage]))
  if (!missing) return []

  return flatten(missing).features.filter(
    (feature): feature is Feature<Polygon> => feature.geometry.type === 'Polygon',
  )
}

function stripCandidates(
  viewport: MapBounds,
  coverage: Feature<Polygon | MultiPolygon>,
  missingPart: Feature<Polygon>,
): MapBounds[] {
  const viewportPoly = boundsToPolygon(viewport)
  const covered = intersect(featureCollection([viewportPoly, coverage]))
  if (!covered) return []

  const coveredBbox = polygonToBounds(covered)
  const candidates: MapBounds[] = [
    {
      west: viewport.west,
      south: viewport.south,
      east: coveredBbox.west,
      north: viewport.north,
    },
    {
      west: coveredBbox.east,
      south: viewport.south,
      east: viewport.east,
      north: viewport.north,
    },
    {
      west: viewport.west,
      south: coveredBbox.north,
      east: viewport.east,
      north: viewport.north,
    },
    {
      west: viewport.west,
      south: viewport.south,
      east: viewport.east,
      north: coveredBbox.south,
    },
  ]

  return candidates.filter((strip) => {
    if (!isValidBounds(strip)) return false

    const overlap = intersect(featureCollection([boundsToPolygon(strip), missingPart]))
    return overlap !== null && area(overlap) > 0
  })
}

function chooseBoundsForMissingPart(
  viewport: MapBounds,
  coverage: Feature<Polygon | MultiPolygon>,
  missingPart: Feature<Polygon>,
): MapBounds[] {
  const partArea = area(missingPart)
  const partBbox = polygonToBounds(missingPart)
  const fillRatio = partArea / area(boundsToPolygon(partBbox))

  if (fillRatio >= HIGH_FILL_RATIO) {
    return [partBbox]
  }

  const strips = stripCandidates(viewport, coverage, missingPart)
  const stripAreas = strips
    .map((strip) => ({ bounds: strip, area: boundsArea(strip) }))
    .sort((a, b) => b.area - a.area)
  const stripTotalArea = stripAreas.reduce((sum, strip) => sum + strip.area, 0)
  const bboxArea = boundsArea(partBbox)

  if (strips.length > 0 && stripTotalArea < bboxArea) {
    return stripAreas.slice(0, MAX_STRIP_REQUESTS).map((strip) => strip.bounds)
  }

  return [partBbox]
}

export function createViewportFetchRequest(
  viewport: MapBounds,
  zoom: number,
  mapSizePx: MapSizePx,
  kind: CoverageFetchKind,
): CoverageFetchRequest | null {
  const prepared = prepareFetchBounds(viewport, viewport, zoom, mapSizePx)
  return prepared ? { bounds: prepared, kind } : null
}

export function computeMissingFetchRequests(
  viewport: MapBounds,
  coverage: Feature<Polygon | MultiPolygon> | null,
  zoom: number,
  mapSizePx: MapSizePx,
): CoverageFetchRequest[] {
  const viewportArea = boundsArea(viewport)

  if (!coverage) {
    const initial = createViewportFetchRequest(viewport, zoom, mapSizePx, 'initial')
    return initial ? [initial] : []
  }

  const parts = missingParts(viewport, coverage)
  const significantParts = parts.filter(
    (part) => area(part) >= MIN_MISSING_AREA_RATIO * viewportArea,
  )
  if (significantParts.length === 0) return []

  const rawBounds = significantParts.flatMap((part) =>
    chooseBoundsForMissingPart(viewport, coverage, part),
  )

  let requests = rawBounds
    .map((request) => {
      const prepared = prepareFetchBounds(request, viewport, zoom, mapSizePx)
      if (!prepared) return null
      return { bounds: prepared, area: boundsArea(prepared), kind: 'strip' as const }
    })
    .filter(
      (request): request is { bounds: MapBounds; area: number; kind: 'strip' } => request !== null,
    )

  if (requests.length === 0) return []

  requests.sort((a, b) => b.area - a.area)

  const sumArea = requests.reduce((sum, request) => sum + request.area, 0)
  if (sumArea >= FULL_FETCH_RATIO * viewportArea) {
    const full = createViewportFetchRequest(viewport, zoom, mapSizePx, 'full')
    return full ? [full] : []
  }

  requests = requests.slice(0, MAX_STRIP_REQUESTS)

  return requests.map((request) => ({
    bounds: request.bounds,
    kind: request.kind,
  }))
}

export function unionIntoCoverage(
  coverage: Feature<Polygon | MultiPolygon> | null,
  requestBounds: MapBounds,
): Feature<Polygon | MultiPolygon> {
  const requestPoly = boundsToPolygon(requestBounds)
  if (!coverage) return requestPoly

  const merged = union(featureCollection([coverage, requestPoly]))
  return merged ?? requestPoly
}

function countDistinctGroups(features: Feature<Polygon, CoverageFetchProps>[]): number {
  return new Set(features.map((feature) => feature.properties.groupId)).size
}

export function capFetchHistory(
  history: FeatureCollection<Polygon, CoverageFetchProps>,
): FeatureCollection<Polygon, CoverageFetchProps> {
  let features = [...history.features]

  while (features.length > MAX_HISTORY_FEATURES) {
    features.shift()
  }

  while (countDistinctGroups(features) > MAX_HISTORY_GROUPS) {
    const oldestGroupId = features[0]?.properties.groupId
    if (!oldestGroupId) break
    features = features.filter((feature) => feature.properties.groupId !== oldestGroupId)
  }

  return { type: 'FeatureCollection', features }
}

export function appendFetchHistory(
  history: FeatureCollection<Polygon, CoverageFetchProps>,
  groupId: string,
  fetchedAt: string,
  requests: CoverageFetchRequest[],
): FeatureCollection<Polygon, CoverageFetchProps> {
  const newFeatures = requests.map((request, requestIndex) => ({
    type: 'Feature' as const,
    geometry: boundsToPolygon(request.bounds).geometry,
    properties: {
      groupId,
      fetchedAt,
      requestIndex,
      requestCount: requests.length,
      kind: request.kind,
    },
  }))

  return capFetchHistory({
    type: 'FeatureCollection',
    features: [...history.features, ...newFeatures],
  })
}
