import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  formatSidepathFeatureId,
  type SidepathPrefix,
  type SidepathSide,
} from '@osm-editor-kit/osm-sidepath-tags'
import {
  matchesHighwayInclusionStyle,
  type HighwayInclusionStyle,
} from '@osm-editor-kit/osm-way-chain'
import {
  analyzeCategoryGaps,
  processBikelanes,
  type BikelaneResult,
} from '@tilda-geo/bicycle-infrastructure'
import type { Feature, LineString } from 'geojson'
import type { MapBounds } from '../../parking/map/types'
import { roadWidthFromTags } from '../../width/domain/road-width-from-tags'
import { isWidthModeLinkWay } from '../../width/domain/width-link-filter'

export type BicyclePaintState = 'complete' | 'incomplete' | 'noInfra' | 'separateGeometry'

export type BicycleHighwayProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'highway'
  highway: string
  category: string
  incomplete: boolean
  paintState: BicyclePaintState
  bikelaneSide: BikelaneResult['_side']
  prefix: string | null
  roadWidthM: number
  hasCenterlinePresence: boolean
}

export type BicycleSidepathProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'sidepath'
  prefix: SidepathPrefix
  side: SidepathSide
  highway: string
  category: string
  incomplete: boolean
  paintState: BicyclePaintState
  bikelaneSide: BikelaneResult['_side']
  roadWidthM: number
  parentRoadWidthM: number
}

export type BicycleFeatureProperties = BicycleHighwayProperties | BicycleSidepathProperties
export type BicycleFeature = Feature<LineString, BicycleFeatureProperties>
export type BicycleFeatureCollection = GeoJSON.FeatureCollection<
  LineString,
  BicycleFeatureProperties
>

function coordInBounds(lat: number, lon: number, bounds: MapBounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east
}

function wayIntersectsBounds(
  way: { nodes: number[] },
  nodeCoords: Record<number, number[]>,
  bounds: MapBounds,
): boolean {
  return way.nodes.some((nodeId) => {
    const coord = nodeCoords[nodeId]
    if (!coord) return false
    return coordInBounds(coord[0]!, coord[1]!, bounds)
  })
}

function wayCoordinates(
  way: { nodes: number[] },
  nodeCoords: Record<number, number[]>,
): [number, number][] {
  return way.nodes
    .map((nodeId) => {
      const coord = nodeCoords[nodeId]
      if (!coord) return null
      return [coord[1]!, coord[0]!] as [number, number]
    })
    .filter((coord): coord is [number, number] => coord != null)
}

function paintStateFromResult(result: BikelaneResult, incomplete: boolean): BicyclePaintState {
  if (result.category === 'separate_geometry') return 'separateGeometry'
  if (!result._infrastructureExists) return 'noInfra'
  if (incomplete) return 'incomplete'
  return 'complete'
}

function hasCenterlinePresence(tags: Record<string, string>): boolean {
  const cyclewayValues = ['separate']
  const bicycleValues = ['use_sidepath', 'optional_sidepath']
  for (const key of Object.keys(tags)) {
    if (key.startsWith('cycleway:') && cyclewayValues.includes(tags[key]!)) return true
    if (key.startsWith('bicycle:') && bicycleValues.includes(tags[key]!)) return true
    if (key === 'cycleway' && cyclewayValues.includes(tags[key]!)) return true
    if (key === 'bicycle' && bicycleValues.includes(tags[key]!)) return true
  }
  return false
}

export function parseBicycleFeaturesFromData(
  data: ParsedOsmData,
  bounds: MapBounds,
  inclusionStyle: HighwayInclusionStyle,
): BicycleFeature[] {
  const features: BicycleFeature[] = []

  for (const way of Object.values(data.ways)) {
    if (!way.tags?.highway) continue
    if (!matchesHighwayInclusionStyle(way.tags, inclusionStyle)) continue
    if (isWidthModeLinkWay(way.tags)) continue
    if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue

    const coordinates = wayCoordinates(way, data.nodeCoords)
    if (coordinates.length < 2) continue

    const width = roadWidthFromTags(way.tags)
    const results = processBikelanes(way.tags)
    const gaps = analyzeCategoryGaps(way.tags, results)
    const gapBySide = new Map(gaps.map((gap) => [gap._side, gap]))

    for (const result of results) {
      const gap = gapBySide.get(result._side)
      const incomplete = gap?.incomplete ?? false
      const paintState = paintStateFromResult(result, incomplete)

      if (result._side === 'self') {
        features.push({
          type: 'Feature',
          id: way.id,
          geometry: { type: 'LineString', coordinates },
          properties: {
            osmId: way.id,
            osmType: 'way',
            featureId: `way/${way.id}`,
            kind: 'highway',
            highway: way.tags.highway,
            category: result.category,
            incomplete,
            paintState,
            bikelaneSide: result._side,
            prefix: result._prefix,
            roadWidthM: width.value,
            hasCenterlinePresence: hasCenterlinePresence(way.tags),
          },
        })
        continue
      }

      if (result._side !== 'left' && result._side !== 'right') continue
      // Missing / unknown sides are centerline-only — do not render offset bands.
      if (paintState === 'noInfra' || result.category === 'unknown') continue
      const prefix = result._prefix === 'sidewalk' ? 'sidewalk' : 'cycleway'
      const side = result._side

      features.push({
        type: 'Feature',
        id: formatSidepathFeatureId({
          osmType: 'way',
          osmId: way.id,
          prefix,
          side,
        }),
        geometry: { type: 'LineString', coordinates },
        properties: {
          osmId: way.id,
          osmType: 'way',
          featureId: formatSidepathFeatureId({
            osmType: 'way',
            osmId: way.id,
            prefix,
            side,
          }),
          kind: 'sidepath',
          prefix,
          side,
          highway: way.tags.highway,
          category: result.category,
          incomplete,
          paintState,
          bikelaneSide: result._side,
          roadWidthM: width.value,
          parentRoadWidthM: width.value,
        },
      })
    }

    // Bare highways (no cycleway tags) yield no processBikelanes results — still show a
    // selectable missing centerline so mappers can start tagging from the map.
    if (results.length === 0) {
      features.push({
        type: 'Feature',
        id: way.id,
        geometry: { type: 'LineString', coordinates },
        properties: {
          osmId: way.id,
          osmType: 'way',
          featureId: `way/${way.id}`,
          kind: 'highway',
          highway: way.tags.highway,
          category: 'unknown',
          incomplete: true,
          paintState: 'noInfra',
          bikelaneSide: 'self',
          prefix: null,
          roadWidthM: width.value,
          hasCenterlinePresence: hasCenterlinePresence(way.tags),
        },
      })
    }
  }

  return features
}

export function emptyBicycleCollection(): BicycleFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function bicycleToCollection(features: BicycleFeature[]): BicycleFeatureCollection {
  return { type: 'FeatureCollection', features }
}
