import type { OsmNode, OsmRelation } from '@osm-editor-kit/osm-data'
import {
  insertNodeOnWaySegment,
  splitOsmWayAtNodeInGraph,
  type SplitOsmWayResult,
} from '@osm-editor-kit/osm-way-edit'
import type { QueryClient } from '@tanstack/react-query'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageSessionKey,
  type OsmCoverageQueryData,
} from './osm-coverage-query'

function sessionKey() {
  return osmCoverageSessionKey(currentOsmSessionParams())
}

export type CutOsmWayResult = SplitOsmWayResult & {
  newNode?: OsmNode
  modifiedRelations: OsmRelation[]
}

/** Split a way in the shared OSM Query graph at an existing node. */
export function cutOsmWayInSession(
  queryClient: QueryClient,
  wayId: number,
  nodeId: number,
  newWayId: number,
): CutOsmWayResult | null {
  const current =
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey()) ?? emptyOsmCoverageData()
  const result = splitOsmWayAtNodeInGraph(current.graph, wayId, nodeId, newWayId)
  if (!result) return null

  queryClient.setQueryData<OsmCoverageQueryData>(sessionKey(), {
    ...current,
    graph: result.graph,
  })

  return {
    oldWay: result.oldWay,
    newWay: result.newWay,
    modifiedRelations: result.modifiedRelations,
  }
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
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey()) ?? emptyOsmCoverageData()
  const way = current.graph.ways[wayId]
  if (!way) return null

  const inserted = insertNodeOnWaySegment(way, segmentIndex, coords, newNodeId)
  if (!inserted) return null

  const graphWithNode: typeof current.graph = {
    ...current.graph,
    nodes: {
      ...current.graph.nodes,
      [newNodeId]: inserted.newNode,
    },
    nodeCoords: {
      ...current.graph.nodeCoords,
      [newNodeId]: [coords.lat, coords.lon] as [number, number],
    },
    ways: {
      ...current.graph.ways,
      [wayId]: inserted.wayWithNode,
    },
  }

  const result = splitOsmWayAtNodeInGraph(graphWithNode, wayId, newNodeId, newWayId)
  if (!result) return null

  queryClient.setQueryData<OsmCoverageQueryData>(sessionKey(), {
    ...current,
    graph: result.graph,
  })

  return {
    oldWay: result.oldWay,
    newWay: result.newWay,
    newNode: inserted.newNode,
    modifiedRelations: result.modifiedRelations,
  }
}
