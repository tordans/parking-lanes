import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  expandSidepaths,
  formatSidepathFeatureId,
  type SidepathPrefix,
  type SidepathSide,
} from '@osm-editor-kit/osm-sidepath-tags'
import {
  matchesHighwayInclusionStyle,
  type HighwayInclusionStyle,
} from '@osm-editor-kit/osm-way-chain'
import type { Feature, LineString } from 'geojson'
import type { MapBounds } from '../../parking/map/types'
import { roadWidthFromTags } from '../../width/domain/road-width-from-tags'
import { isWidthModeLinkWay } from '../../width/domain/width-link-filter'
import { classifySurfaceInfra, type SurfaceInfraClass } from '../domain/surface-infra-class'
import {
  readTaggedSmoothness,
  readTaggedSurface,
  surfacePaintState,
  type SurfacePaintState,
} from '../domain/surface-tag-read'

export type SurfaceHighwayProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'highway'
  highway: string
  infra: SurfaceInfraClass
  surface?: string
  smoothness?: string
  paintState: SurfacePaintState
  missingSurface: boolean
  missingSmoothness: boolean
  roadWidthM: number
}

export type SurfaceSidepathProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'sidepath'
  prefix: SidepathPrefix
  side: SidepathSide
  highway: string
  infra: SurfaceInfraClass
  surface?: string
  smoothness?: string
  paintState: SurfacePaintState
  missingSurface: boolean
  missingSmoothness: boolean
  roadWidthM: number
  parentRoadWidthM: number
}

export type SurfaceFeatureProperties = SurfaceHighwayProperties | SurfaceSidepathProperties
export type SurfaceFeature = Feature<LineString, SurfaceFeatureProperties>
export type SurfaceFeatureCollection = GeoJSON.FeatureCollection<
  LineString,
  SurfaceFeatureProperties
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

function surfacePropertiesFromTags(
  tags: Record<string, string>,
  infra: SurfaceInfraClass,
  roadWidthM: number,
): Pick<
  SurfaceHighwayProperties,
  | 'surface'
  | 'smoothness'
  | 'paintState'
  | 'missingSurface'
  | 'missingSmoothness'
  | 'roadWidthM'
  | 'infra'
> {
  const paintState = surfacePaintState(tags)
  const surface = readTaggedSurface(tags)
  const smoothness = readTaggedSmoothness(tags)

  return {
    infra,
    surface,
    smoothness,
    paintState,
    missingSurface: paintState === 'missing_surface',
    missingSmoothness: paintState === 'missing_smoothness',
    roadWidthM,
  }
}

export function parseSurfaceFeaturesFromData(
  data: ParsedOsmData,
  bounds: MapBounds,
  inclusionStyle: HighwayInclusionStyle,
): SurfaceFeature[] {
  const features: SurfaceFeature[] = []

  for (const way of Object.values(data.ways)) {
    if (!way.tags?.highway) continue
    if (!matchesHighwayInclusionStyle(way.tags, inclusionStyle)) continue
    if (isWidthModeLinkWay(way.tags)) continue
    if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue

    const coordinates = wayCoordinates(way, data.nodeCoords)
    if (coordinates.length < 2) continue

    const width = roadWidthFromTags(way.tags)
    const highwayProps = surfacePropertiesFromTags(
      way.tags,
      classifySurfaceInfra(way.tags),
      width.value,
    )

    features.push({
      type: 'Feature',
      id: way.id,
      geometry: {
        type: 'LineString',
        coordinates,
      },
      properties: {
        osmId: way.id,
        osmType: 'way',
        featureId: `way/${way.id}`,
        kind: 'highway',
        highway: way.tags.highway,
        ...highwayProps,
      },
    })

    for (const sidepath of expandSidepaths(way.id, way.tags)) {
      const sidepathWidth = roadWidthFromTags(sidepath.tags)
      const sidepathProps = surfacePropertiesFromTags(
        sidepath.tags,
        classifySurfaceInfra(sidepath.tags, { prefix: sidepath.ref.prefix }),
        sidepathWidth.value,
      )

      features.push({
        type: 'Feature',
        id: formatSidepathFeatureId(sidepath.ref),
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {
          osmId: way.id,
          osmType: 'way',
          featureId: formatSidepathFeatureId(sidepath.ref),
          kind: 'sidepath',
          prefix: sidepath.ref.prefix,
          side: sidepath.ref.side,
          highway: sidepath.tags.highway ?? sidepath.ref.prefix,
          parentRoadWidthM: width.value,
          ...sidepathProps,
        },
      })
    }
  }

  return features
}

export function emptySurfaceCollection(): SurfaceFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function surfacesToCollection(features: SurfaceFeature[]): SurfaceFeatureCollection {
  return { type: 'FeatureCollection', features }
}
