import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { HighwayInclusionStyle } from '@osm-editor-kit/osm-way-chain'
import {
  parseParkingAreaFeatures,
  parseParkingPointFeatures,
  parseParkingRelationFeatures,
} from './parse-areas-points'
import { parseParkingLaneFeatures } from './parse-lanes'
import type { MapBounds } from './types'
import type { ParkingFeature } from './types'

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

export function parseParkingFeaturesFromData(
  data: ParsedOsmData,
  bounds: MapBounds,
  zoom: number,
  inclusionStyle: HighwayInclusionStyle,
  existingFeatureIds?: ReadonlySet<string>,
): { lanes: ParkingFeature[]; areas: ParkingFeature[]; points: ParkingFeature[] } {
  const lanes: ParkingFeature[] = []
  const areas: ParkingFeature[] = []
  const points: ParkingFeature[] = []

  const keep = (features: ParkingFeature[]) =>
    existingFeatureIds
      ? features.filter((feature) => !existingFeatureIds.has(feature.properties.featureId))
      : features

  for (const relation of Object.values(data.relations)) {
    if (relation.tags?.amenity !== 'parking') continue
    if (!relation.members.some((member) => member.type === 'way' && data.ways[member.ref])) {
      continue
    }
    const memberWay = relation.members.find(
      (member) => member.type === 'way' && data.ways[member.ref],
    )
    if (!memberWay || !wayIntersectsBounds(data.ways[memberWay.ref]!, data.nodeCoords, bounds)) {
      continue
    }
    areas.push(...keep(parseParkingRelationFeatures(relation, data.nodeCoords, data.ways, zoom)))
  }

  for (const way of Object.values(data.ways)) {
    if (way.tags?.highway) {
      if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue
      lanes.push(...keep(parseParkingLaneFeatures(way, data.nodeCoords, zoom, inclusionStyle)))
    } else if (way.tags?.amenity === 'parking') {
      if (!wayIntersectsBounds(way, data.nodeCoords, bounds)) continue
      areas.push(...keep(parseParkingAreaFeatures(way, data.nodeCoords, zoom)))
    }
  }

  for (const node of Object.values(data.nodes)) {
    if (node.tags?.amenity !== 'parking_entrance' && node.tags?.amenity !== 'parking') continue
    if (!coordInBounds(node.lat, node.lon, bounds)) continue
    points.push(...keep(parseParkingPointFeatures(node, zoom)))
  }

  return { lanes, areas, points }
}
