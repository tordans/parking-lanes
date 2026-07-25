import type { OsmNode, OsmWay } from '@osm-editor-kit/osm-data'
import type { QueryClient } from '@tanstack/react-query'
import { addChangedEntity, getPendingWay } from '../../utils/changes-store'
import type { ChangeSource } from '../../utils/changeset-message'
import { mergeWayEdit } from './merge-way-edit'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageSessionKey,
  type OsmCoverageQueryData,
} from './osm-coverage-query'

function sessionKey() {
  return osmCoverageSessionKey(currentOsmSessionParams())
}

export function getOsmWayFromSession(queryClient: QueryClient, wayId: number): OsmWay | null {
  const current =
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey()) ?? emptyOsmCoverageData()
  return current.graph.ways[wayId] ?? null
}

export function updateOsmWayInSession(queryClient: QueryClient, way: OsmWay) {
  queryClient.setQueryData<OsmCoverageQueryData>(
    sessionKey(),
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

export function restoreOsmWayInSession(queryClient: QueryClient, way: OsmWay) {
  updateOsmWayInSession(queryClient, way)
}

export function removeOsmWayFromSession(queryClient: QueryClient, wayId: number) {
  queryClient.setQueryData<OsmCoverageQueryData>(
    sessionKey(),
    (current = emptyOsmCoverageData()) => {
      const { [wayId]: _removed, ...remainingWays } = current.graph.ways
      return {
        ...current,
        graph: {
          ...current.graph,
          ways: remainingWays,
        },
      }
    },
  )
}

export function remapOsmWayIdInSession(
  queryClient: QueryClient,
  oldId: number,
  newId: number,
): OsmWay | null {
  const current =
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey()) ?? emptyOsmCoverageData()
  const oldWay = current.graph.ways[oldId]
  if (!oldWay) return null

  const remappedWay: OsmWay = { ...oldWay, id: newId }
  const { [oldId]: _removed, ...remainingWays } = current.graph.ways

  queryClient.setQueryData<OsmCoverageQueryData>(sessionKey(), {
    ...current,
    graph: {
      ...current.graph,
      ways: {
        ...remainingWays,
        [newId]: remappedWay,
      },
    },
  })

  return remappedWay
}

export function remapOsmNodeIdInSession(
  queryClient: QueryClient,
  oldId: number,
  newId: number,
): OsmNode | null {
  const current =
    queryClient.getQueryData<OsmCoverageQueryData>(sessionKey()) ?? emptyOsmCoverageData()
  const oldNode = current.graph.nodes[oldId]
  if (!oldNode) return null

  const remappedNode: OsmNode = { ...oldNode, id: newId }
  const { [oldId]: _removedNode, ...remainingNodes } = current.graph.nodes
  const oldCoord = current.graph.nodeCoords[oldId]
  const { [oldId]: _removedCoord, ...remainingCoords } = current.graph.nodeCoords

  const ways = Object.fromEntries(
    Object.entries(current.graph.ways).map(([wayId, way]) => [
      wayId,
      {
        ...way,
        nodes: way.nodes.map((nodeId) => (nodeId === oldId ? newId : nodeId)),
      },
    ]),
  )

  queryClient.setQueryData<OsmCoverageQueryData>(sessionKey(), {
    ...current,
    graph: {
      ...current.graph,
      nodes: {
        ...remainingNodes,
        [newId]: remappedNode,
      },
      nodeCoords: oldCoord ? { ...remainingCoords, [newId]: oldCoord } : remainingCoords,
      ways,
    },
  })

  return remappedNode
}

/**
 * Apply a mode edit to the shared OSM session + pending changes store.
 * Merges onto any existing pending way so multi-mode edits on one way accumulate.
 */
export function commitOsmWayChange(
  queryClient: QueryClient,
  incoming: OsmWay,
  source: ChangeSource,
): number {
  const sessionWay = getOsmWayFromSession(queryClient, incoming.id)
  const pendingWay = getPendingWay(incoming.id)
  const base = pendingWay ?? sessionWay ?? incoming
  const merged = mergeWayEdit(base, incoming, source)

  updateOsmWayInSession(queryClient, merged)

  return addChangedEntity(merged, {
    // First edit only: snapshot pre-edit session (not an already-pending way).
    original: pendingWay ? undefined : sessionWay,
    source,
  })
}
