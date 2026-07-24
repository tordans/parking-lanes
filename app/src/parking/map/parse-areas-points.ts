import type { OsmNode, OsmRelation, OsmWay } from '../../utils/types/osm-data'
import { getConditions } from '../domain/access-condition'
import { getColor, getColorByDate } from '../domain/condition-color'
import type { ParkingFeature } from './types'

function toPolygonCoords(nodeCoords: Record<number, number[]>, way: OsmWay): [number, number][][] {
  const ring = way.nodes.map((nodeId) => {
    const node = nodeCoords[nodeId]!
    return [node[1]!, node[0]!] as [number, number]
  })
  if (ring.length > 0) {
    const first = ring[0]!
    const last = ring[ring.length - 1]!
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
  }
  return [ring]
}

export function parseParkingAreaFeatures(
  way: OsmWay,
  nodeCoords: Record<number, number[]>,
  _zoom: number,
): ParkingFeature[] {
  const conditions = getConditions(way.tags)
  const style = { weight: 2, color: getColor(conditions?.default) ?? '#888888' }
  return [
    {
      type: 'Feature',
      id: way.type + way.id,
      geometry: { type: 'Polygon', coordinates: toPolygonCoords(nodeCoords, way) },
      properties: {
        featureId: way.type + way.id,
        kind: 'area',
        color: style.color,
        weight: style.weight,
        offset: 0,
        osmType: way.type,
        osmId: way.id,
      },
    },
  ]
}

export function parseParkingRelationFeatures(
  relation: OsmRelation,
  nodeCoords: Record<number, number[]>,
  ways: Record<number, OsmWay>,
  _zoom: number,
): ParkingFeature[] {
  const wayGroups: OsmWay[][] = []
  for (const member of relation.members) {
    if (member.type === 'way' && member.role === 'outer') {
      const way = ways[member.ref]
      if (!way) continue
      const group = wayGroups.find((g) =>
        g.some(
          (w) =>
            w.nodes[0] === way.nodes[0] ||
            w.nodes[0] === w.nodes.at(-1) ||
            w.nodes.at(-1) === way.nodes[0] ||
            w.nodes.at(-1) === way.nodes.at(-1),
        ),
      )
      if (group) group.push(way)
      else wayGroups.push([way])
    }
  }

  const features: ParkingFeature[] = []
  const conditions = getConditions(relation.tags)

  for (const wayGroup of wayGroups) {
    const nodeGroup = [...wayGroup[0]!.nodes]
    const remaining = wayGroup.slice(1)
    while (remaining.length) {
      const lastNode = nodeGroup.at(-1)
      const newWayIndex = remaining.findIndex(
        (w) => w.nodes[0] === lastNode || w.nodes.at(-1) === lastNode,
      )
      if (newWayIndex === -1) break
      const newWay = remaining.splice(newWayIndex, 1)[0]!
      if (newWay.nodes[0] === lastNode) nodeGroup.push(...newWay.nodes.slice(1))
      else nodeGroup.push(...newWay.nodes.slice(0, -1).reverse())
    }

    const ring = nodeGroup.map((nodeId) => {
      const node = nodeCoords[nodeId]
      return [node[1], node[0]] as [number, number]
    })
    if (ring.length > 0) {
      const first = ring[0]!
      const last = ring[ring.length - 1]!
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
    }

    features.push({
      type: 'Feature',
      id: relation.type + relation.id,
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {
        featureId: relation.type + relation.id,
        kind: 'area',
        color: getColor(conditions?.default) ?? '#888888',
        weight: 2,
        offset: 0,
        osmType: relation.type,
        osmId: relation.id,
      },
    })
  }

  return features
}

export function parseParkingPointFeatures(node: OsmNode, zoom: number): ParkingFeature[] {
  const conditions = getConditions(node.tags)
  const radius = getRadius(zoom)
  return [
    {
      type: 'Feature',
      id: String(node.id),
      geometry: { type: 'Point', coordinates: [node.lon, node.lat] },
      properties: {
        featureId: String(node.id),
        kind: 'point',
        color: getColor(conditions?.default) ?? '#888888',
        weight: radius,
        offset: 0,
        osmType: node.type,
        osmId: node.id,
      },
    },
  ]
}

export function updateAreaFeatureColors(
  features: ParkingFeature[],
  datetime: Date,
  wayTags: Record<number, OsmWay['tags']>,
  relationTags: Record<number, OsmRelation['tags']>,
): ParkingFeature[] {
  return features.map((feature) => {
    if (feature.properties.kind !== 'area') return feature

    const tags =
      feature.properties.osmType === 'relation'
        ? relationTags[feature.properties.osmId]
        : wayTags[feature.properties.osmId]
    if (!tags) return feature

    const conditions = getConditions(tags)
    return {
      ...feature,
      properties: {
        ...feature.properties,
        color: getColorByDate(conditions, datetime) ?? '#888888',
      },
    }
  })
}

export function updatePointFeatureColors(
  features: ParkingFeature[],
  datetime: Date,
  nodeTags: Record<number, OsmNode['tags']>,
): ParkingFeature[] {
  return features.map((feature) => {
    if (feature.properties.kind !== 'point') return feature

    const tags = nodeTags[feature.properties.osmId]
    if (!tags) return feature

    const conditions = getConditions(tags)
    return {
      ...feature,
      properties: {
        ...feature.properties,
        color: getColorByDate(conditions, datetime) ?? '#888888',
      },
    }
  })
}

export function updatePointFeatureStyles(
  features: ParkingFeature[],
  zoom: number,
): ParkingFeature[] {
  const radius = getRadius(zoom)
  return features.map((feature) => {
    if (feature.properties.kind !== 'point') return feature
    return {
      ...feature,
      properties: { ...feature.properties, weight: radius },
    }
  })
}

function getRadius(zoom: number) {
  if (zoom < 12) return 1
  if (zoom < 14) return 2
  if (zoom < 15) return 3
  if (zoom < 17) return 4
  return 5
}
