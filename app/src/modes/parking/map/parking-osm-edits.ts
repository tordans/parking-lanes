import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { QueryClient } from '@tanstack/react-query'
import {
  emptyParkingOsmData,
  parkingOsmSessionKey,
  type ParkingOsmQueryData,
} from './parking-osm-query'

const sessionKey = parkingOsmSessionKey({})

export function updateParkingOsmWay(queryClient: QueryClient, way: OsmWay) {
  queryClient.setQueryData<ParkingOsmQueryData>(sessionKey, (current = emptyParkingOsmData()) => ({
    ...current,
    graph: {
      ...current.graph,
      ways: {
        ...current.graph.ways,
        [way.id]: way,
      },
    },
  }))
}

export function remapParkingOsmWayId(
  queryClient: QueryClient,
  oldId: number,
  newId: number,
): OsmWay | null {
  const current = queryClient.getQueryData<ParkingOsmQueryData>(sessionKey) ?? emptyParkingOsmData()
  const oldWay = current.graph.ways[oldId]
  if (!oldWay) return null

  const remappedWay: OsmWay = { ...oldWay, id: newId }
  const { [oldId]: _removed, ...remainingWays } = current.graph.ways

  queryClient.setQueryData<ParkingOsmQueryData>(sessionKey, {
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
