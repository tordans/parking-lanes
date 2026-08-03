export type {
  RoadSpaceSlotKind,
  RoadSpaceZone,
  RoadSpaceDirection,
  RoadSpaceProvenance,
  RoadSpaceSlot,
  RoadSpaceSegmentRole,
  RoadSpaceSegment,
  RoadSpaceMedianHint,
  SeparatelyMappedSidepath,
  RoadSpaceChain,
  SceneSlotRectKind,
  SceneSlotRect,
  ScenePolyline,
  SceneSegmentBand,
  SceneRibbon,
  SceneRibbonBandSlice,
  SceneCarriagewayPlate,
  RoadSpaceScene,
  RoadSpaceSceneDebug,
  SceneDebugBandOffset,
  SceneDebugCorrespondenceLink,
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

export {
  buildRoadSpaceSegment,
  createsOnWaySidepathSlot,
  prepareDualSiblingSlots,
} from './from-tags'

export {
  parsePlacement,
  resolvePlacement,
  centrelineOffsetM,
  centrelineOffsetMDriving,
  drivingLaneCount,
  collectPlacementIssues,
  type Placement,
  type PlacementKind,
} from './placement'

export {
  matchStacks,
  matchSegmentStacks,
  solveChainOffsets,
  slicesCorrespond,
  turnSignature,
  slotStartsM,
  slotCenterM,
  seamChangeMagnitude,
  type StackCorrespondence,
  type StackPair,
  type ChainOffsetSolution,
  type SegmentStack,
} from './correspondence'

export { layoutRoadSpace } from './layout'

export { sceneToSvg } from './svg'
