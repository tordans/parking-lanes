import type { OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { LineString } from 'geojson'
import type { Segment } from './domain/types'
import type { OsmDataAdapter } from './ports/OsmDataAdapter'

function wayCoordinates(
  way: OsmWay,
  nodeCoords: ParsedOsmData['nodeCoords'],
): LineString['coordinates'] {
  return way.nodes
    .map((nodeId) => {
      const coord = nodeCoords[nodeId]
      if (!coord) return null
      return [coord[1]!, coord[0]!] as [number, number]
    })
    .filter((coord): coord is [number, number] => coord != null)
}

export function osmWayToSegment(way: OsmWay, nodeCoords: ParsedOsmData['nodeCoords']): Segment {
  return {
    id: way.id,
    version: way.version,
    nodeIds: way.nodes,
    tags: way.tags,
    geometry: {
      type: 'LineString',
      coordinates: wayCoordinates(way, nodeCoords),
    },
  }
}

function buildNodeWayIndex(graph: ParsedOsmData): Map<number, number[]> {
  const index = new Map<number, number[]>()
  for (const way of Object.values(graph.ways)) {
    for (const nodeId of way.nodes) {
      const existing = index.get(nodeId)
      if (existing) {
        existing.push(way.id)
      } else {
        index.set(nodeId, [way.id])
      }
    }
  }
  return index
}

/**
 * Adapter backed by an already-loaded session graph (bbox coverage data).
 * Lookups are synchronous but wrapped in Promises to satisfy `OsmDataAdapter`.
 */
export function createSessionGraphAdapter(graph: ParsedOsmData): OsmDataAdapter {
  const nodeWayIndex = buildNodeWayIndex(graph)
  const segmentCache = new Map<number, Segment>()

  function getSegment(wayId: number): Segment {
    const cached = segmentCache.get(wayId)
    if (cached) return cached

    const way = graph.ways[wayId]
    if (!way) throw new Error(`Way ${wayId} not found in session graph`)

    const segment = osmWayToSegment(way, graph.nodeCoords)
    segmentCache.set(wayId, segment)
    return segment
  }

  return {
    getWay: (wayId) => Promise.resolve(getSegment(wayId)),
    getWaysForNode: (nodeId) => {
      const wayIds = nodeWayIndex.get(nodeId) ?? []
      return Promise.resolve(wayIds.map(getSegment))
    },
  }
}
