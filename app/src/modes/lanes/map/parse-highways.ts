import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { Feature, LineString } from 'geojson'
import {
  matchesStreetSpaceWay,
  type HighwayInclusionStyle,
} from '../../../shell/map/street-space-way-policy'
import type { MapBounds } from '../../parking/map/types'
import {
  isDeemphasizedHighway,
  laneCompleteness,
  type LaneCompleteness,
} from '../domain/lane-completeness'

export type LanesHighwayProperties = {
  osmId: number
  osmType: 'way'
  featureId: string
  highway: string
  completeness: LaneCompleteness
  deemphasized: boolean
  name?: string
  ref?: string
}

export type LanesFeature = Feature<LineString, LanesHighwayProperties>
export type LanesFeatureCollection = GeoJSON.FeatureCollection<LineString, LanesHighwayProperties>

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

export function parseLanesFeaturesFromData(
  data: ParsedOsmData,
  bounds: MapBounds,
  inclusionStyle: HighwayInclusionStyle,
): LanesFeature[] {
  const features: LanesFeature[] = []

  for (const way of Object.values(data.ways)) {
    const highway = way.tags?.highway
    if (!highway || !matchesStreetSpaceWay(way.tags, inclusionStyle)) continue
    if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue

    const coordinates = wayCoordinates(way, data.nodeCoords)
    if (coordinates.length < 2) continue

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
        highway,
        completeness: laneCompleteness(way.tags),
        deemphasized: isDeemphasizedHighway(highway),
        name: way.tags.name,
        ref: way.tags.ref,
      },
    })
  }

  return features
}

export function emptyLanesCollection(): LanesFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}

export function lanesToCollection(features: LanesFeature[]): LanesFeatureCollection {
  return { type: 'FeatureCollection', features }
}
