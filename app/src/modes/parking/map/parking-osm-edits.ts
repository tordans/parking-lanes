import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { QueryClient } from '@tanstack/react-query'
import {
  remapOsmWayIdInSession,
  updateOsmWayInSession,
} from '../../../shell/map/osm-session-way-edits'

export function updateParkingOsmWay(queryClient: QueryClient, way: OsmWay) {
  updateOsmWayInSession(queryClient, way)
}

export function remapParkingOsmWayId(
  queryClient: QueryClient,
  oldId: number,
  newId: number,
): OsmWay | null {
  return remapOsmWayIdInSession(queryClient, oldId, newId)
}
