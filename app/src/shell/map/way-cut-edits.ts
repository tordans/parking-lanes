import type { OsmNode } from '@osm-editor-kit/osm-data'
import {
  insertNodeOnWaySegment,
  splitOsmWayAtNode,
  type SplitOsmWayResult,
} from '@osm-editor-kit/osm-way-edit'
import type { QueryClient } from '@tanstack/react-query'
import {
  emptyOsmCoverageData,
  osmCoverageSessionKey,
  type OsmCoverageQueryData,
} from './osm-coverage-query'

const sessionKey = osmCoverageSessionKey({})

export type CutOsmWayResult = SplitOsmWayResult & {
  newNode?: OsmNode
}

/** Split a way in the shared OSM Query graph at an existing node. */
export function cutOsmWayInSession(
  queryClient: QueryClient,
  wayId: number,
  nodeId: number,
  newWayId: number,
): SplitOsmWayResult | null {
  const current =
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey) ?? emptyOsmCoverageData()
  const way = current.graph.ways[wayId]
  if (!way) return null

  const result = splitOsmWayAtNode(way, nodeId, newWayId)
  if (!result) return null

  queryClient.setQueryData<OsmCoverageQueryData>(sessionKey, {
    ...current,
    graph: {
      ...current.graph,
      ways: {
        ...current.graph.ways,
        [wayId]: result.oldWay,
        [newWayId]: result.newWay,
      },
    },
  })

  return result
}

/** Insert a node on a segment, then split the way at that node. */
export function insertNodeAndCutOsmWayInSession(
  queryClient: QueryClient,
  wayId: number,
  segmentIndex: number,
  coords: { lat: number; lon: number },
  newNodeId: number,
  newWayId: number,
): CutOsmWayResult | null {
  const current =
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey) ?? emptyOsmCoverageData()
  const way = current.graph.ways[wayId]
  if (!way) return null

  const inserted = insertNodeOnWaySegment(way, segmentIndex, coords, newNodeId)
  if (!inserted) return null

  const result = splitOsmWayAtNode(inserted.wayWithNode, newNodeId, newWayId)
  if (!result) return null

  queryClient.setQueryData<OsmCoverageQueryData>(sessionKey, {
    ...current,
    graph: {
      ...current.graph,
      nodes: {
        ...current.graph.nodes,
        [newNodeId]: inserted.newNode,
      },
      nodeCoords: {
        ...current.graph.nodeCoords,
        [newNodeId]: [coords.lat, coords.lon],
      },
      ways: {
        ...current.graph.ways,
        [wayId]: result.oldWay,
        [newWayId]: result.newWay,
      },
    },
  })

  return { ...result, newNode: inserted.newNode }
}
