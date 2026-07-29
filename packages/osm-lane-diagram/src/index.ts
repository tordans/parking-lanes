export type {
  RoadSpaceSlotKind,
  RoadSpaceZone,
  RoadSpaceDirection,
  RoadSpaceProvenance,
  RoadSpaceSlot,
  RoadSpaceSegmentRole,
  RoadSpaceSegment,
  SeparatelyMappedSidepath,
  RoadSpaceChain,
  SceneSlotRectKind,
  SceneSlotRect,
  ScenePolyline,
  SceneSegmentBand,
  RoadSpaceScene,
} from './types'

export {
  DEFAULT_WIDTHS_M,
  DEFAULT_METERS_TO_PX,
  SEGMENT_BAND_HEIGHT_PX,
  SEGMENT_GAP_PX,
  DEFAULT_MEDIAN_GAP_M,
} from './defaults'

export {
  formatLaneSlotId,
  formatEdgeSlotId,
  parseSlotId,
  type ParsedSlotId,
  type ParsedLaneSlotId,
  type ParsedEdgeSlotId,
} from './slot-ids'

export { buildRoadSpaceSegment, createsOnWaySidepathSlot } from './from-tags'

export {
  parsePlacement,
  resolvePlacement,
  centrelineOffsetM,
  centrelineOffsetMDriving,
  drivingLaneCount,
  type Placement,
  type PlacementKind,
} from './placement'

export { layoutRoadSpace } from './layout'

export { sceneToSvg } from './svg'
