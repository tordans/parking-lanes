import type { OsmWay } from '@osm-editor-kit/osm-data'
import { parseWayLanes, serializeWayLanes, type WayLaneModel } from '@osm-editor-kit/osm-lanes'

export function parseWayLaneModel(way: OsmWay): WayLaneModel {
  return parseWayLanes(way.tags)
}

export function commitLaneModelToWay(way: OsmWay, model: WayLaneModel): OsmWay {
  return {
    ...way,
    tags: serializeWayLanes(model, way.tags),
  }
}

/**
 * Oneway lane-count edit: keep `lanesTotal` and `lanesForward` in sync.
 * `serializeWayLanes` (oneway) writes `lanes` from `lanesForward ?? lanesTotal`;
 * updating only one of them drops the change.
 */
export function applyOnewayLaneCount(model: WayLaneModel, value: number | undefined): WayLaneModel {
  return { ...model, lanesTotal: value, lanesForward: value }
}
