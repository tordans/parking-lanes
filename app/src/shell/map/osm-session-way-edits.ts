import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { QueryClient } from '@tanstack/react-query'
import {
  emptyOsmCoverageData,
  osmCoverageSessionKey,
  type OsmCoverageQueryData,
} from './osm-coverage-query'

const sessionKey = osmCoverageSessionKey({})

export function getOsmWayFromSession(queryClient: QueryClient, wayId: number): OsmWay | null {
  const current =
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey) ?? emptyOsmCoverageData()
  return current.graph.ways[wayId] ?? null
}

export function restoreOsmWayInSession(queryClient: QueryClient, way: OsmWay) {
  queryClient.setQueryData<OsmCoverageQueryData>(
    sessionKey,
    (current = emptyOsmCoverageData()) => ({
      ...current,
      graph: {
        ...current.graph,
        ways: {
          ...current.graph.ways,
          [way.id]: way,
        },
      },
    }),
  )
}

export function removeOsmWayFromSession(queryClient: QueryClient, wayId: number) {
  queryClient.setQueryData<OsmCoverageQueryData>(sessionKey, (current = emptyOsmCoverageData()) => {
    const { [wayId]: _removed, ...remainingWays } = current.graph.ways
    return {
      ...current,
      graph: {
        ...current.graph,
        ways: remainingWays,
      },
    }
  })
}
