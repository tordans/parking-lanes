import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  expandSidepaths,
  formatSidepathFeatureId,
  type SidepathPrefix,
  type SidepathSide,
} from '@osm-editor-kit/osm-sidepath-tags'
import type { Feature, LineString } from 'geojson'
import type { MapBounds } from '../../parking/map/types'
import {
  matchesStreetSpaceInclusion,
  type HighwayInclusionStyle,
} from '../../../shell/map/street-space-way-policy'
import {
  roadWidthFromTags,
  type RoadWidthKind,
  type RoadWidthSource,
} from '../domain/road-width-from-tags'
import { classifyWidthInfra, type WidthInfraClass } from '../domain/width-infra-class'
import { isWidthModeLinkWay } from '../domain/width-link-filter'

export type WidthHighwayProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'highway'
  highway: string
  infra: WidthInfraClass
  roadWidthM: number
  widthSource: RoadWidthSource
  widthConfidence: string
  widthKind: RoadWidthKind
}

export type WidthSidepathProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  kind: 'sidepath'
  prefix: SidepathPrefix
  side: SidepathSide
  highway: string
  roadWidthM: number
  widthSource: RoadWidthSource
  widthKind: RoadWidthKind
  parentRoadWidthM: number
}

export type WidthFeatureProperties = WidthHighwayProperties | WidthSidepathProperties
export type WidthFeature = Feature<LineString, WidthFeatureProperties>
export type WidthFeatureCollection = GeoJSON.FeatureCollection<LineString, WidthFeatureProperties>

/** @deprecated Use WidthFeatureCollection */
export type WidthHighwayFeature = WidthFeature
/** @deprecated Use WidthFeatureCollection */
export type WidthHighwayCollection = WidthFeatureCollection

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

export function parseHighwayFeaturesFromData(
  data: ParsedOsmData,
  bounds: MapBounds,
  inclusionStyle: HighwayInclusionStyle,
): WidthFeature[] {
  const features: WidthFeature[] = []

  for (const way of Object.values(data.ways)) {
    if (!way.tags?.highway) continue
    if (!matchesStreetSpaceInclusion(way.tags, inclusionStyle)) continue
    if (isWidthModeLinkWay(way.tags)) continue
    if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue

    const coordinates = wayCoordinates(way, data.nodeCoords)
    if (coordinates.length < 2) continue

    const width = roadWidthFromTags(way.tags)

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
        infra: classifyWidthInfra(way.tags),
        roadWidthM: width.value,
        widthSource: width.source,
        widthConfidence: width.confidence,
        widthKind: width.kind,
      },
    })

    for (const sidepath of expandSidepaths(way.id, way.tags)) {
      const sidepathWidth = roadWidthFromTags(sidepath.tags)

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
          roadWidthM: sidepathWidth.value,
          widthSource: sidepathWidth.source,
          widthKind: sidepathWidth.kind,
          parentRoadWidthM: width.value,
        },
      })
    }
  }

  return features
}

export function emptyHighwayCollection(): WidthFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function highwaysToCollection(features: WidthFeature[]): WidthFeatureCollection {
  return { type: 'FeatureCollection', features }
}
