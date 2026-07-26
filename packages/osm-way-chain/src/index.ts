export type {
  JunctionChoice,
  NeighborDirection,
  OsmTags,
  Segment,
  SegmentChain,
} from './domain/types'
export {
  isRoadLikeHighway,
  isRoadLikeSegment,
  ROAD_LIKE_HIGHWAY_BASE_REGEX,
} from './highway-filter'
export type { OsmDataAdapter } from './ports/OsmDataAdapter'
export { createSessionGraphAdapter, osmWayToSegment } from './session-graph-adapter'
export {
  buildChain,
  extendChainAtJunction,
  getOtherEndpointNodeId,
  getSharedNodeBetween,
  recenterChain,
  type BuildChainOptions,
  type BuildChainResult,
} from './traversal/buildChain'
export {
  isReversedAtNode,
  normalizeTagsForDirection,
  orientNeighbor,
  swapLeftRightKey,
} from './traversal/direction'
export {
  type CandidateFilter,
  filterNeighborCandidates,
  getEndpointNodeId,
  getKindKey,
  pickBestNeighbor,
  sameKind,
  scoreNeighborCandidate,
} from './traversal/neighborMatch'
