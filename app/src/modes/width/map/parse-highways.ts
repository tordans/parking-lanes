import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { Feature, LineString } from 'geojson'
import type { MapBounds } from '../../parking/map/types'
import {
  roadWidthFromTags,
  type RoadWidthKind,
  type RoadWidthSource,
} from '../domain/road-width-from-tags'
import { isWidthModeLinkWay } from '../domain/width-link-filter'

export type WidthHighwayProperties = {
  osmId: number
  osmType: 'way'
  highway: string
  roadWidthM: number
  widthSource: RoadWidthSource
  widthConfidence: string
  widthKind: RoadWidthKind
}

export type WidthHighwayFeature = Feature<LineString, WidthHighwayProperties>
export type WidthHighwayCollection = GeoJSON.FeatureCollection<LineString, WidthHighwayProperties>

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

export function parseHighwayFeaturesFromData(
  data: ParsedOsmData,
  bounds: MapBounds,
): WidthHighwayFeature[] {
  const features: WidthHighwayFeature[] = []

  for (const way of Object.values(data.ways)) {
    if (!way.tags?.highway) continue
    if (isWidthModeLinkWay(way.tags)) continue
    if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue

    const coordinates = way.nodes
      .map((nodeId) => {
        const coord = data.nodeCoords[nodeId]
        if (!coord) return null
        return [coord[1]!, coord[0]!] as [number, number]
      })
      .filter((coord): coord is [number, number] => coord != null)

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
        highway: way.tags.highway,
        roadWidthM: width.value,
        widthSource: width.source,
        widthConfidence: width.confidence,
        widthKind: width.kind,
      },
    })
  }

  return features
}

export function emptyHighwayCollection(): WidthHighwayCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function highwaysToCollection(features: WidthHighwayFeature[]): WidthHighwayCollection {
  return { type: 'FeatureCollection', features }
}
