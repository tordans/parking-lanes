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
