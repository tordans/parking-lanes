import { splitOsmWayAtNode, type SplitOsmWayResult } from '@osm-editor-kit/osm-way-edit'
import type { QueryClient } from '@tanstack/react-query'
import {
  emptyOsmCoverageData,
  osmCoverageSessionKey,
  type OsmCoverageQueryData,
} from './osm-coverage-query'

const sessionKey = osmCoverageSessionKey({})

/** Split a way in the shared OSM Query graph. */
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
