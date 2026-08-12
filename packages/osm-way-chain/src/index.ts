export type {
  JunctionChoice,
  NeighborDirection,
  OsmTags,
  Segment,
  SegmentChain,
} from './domain/types'
export {
  createLegacyStreetRoadWayPolicy,
  DEFAULT_HIGHWAY_INCLUSION_STYLE,
  isClutterAccessWay,
  isEditableRoadLikeHighway,
  isEditableRoadLikeSegment,
  isRoadLikeHighway,
  isRoadLikeSegment,
  matchesHighwayInclusionStyle,
  overpassRoadLikeSelector,
  ROAD_LIKE_HIGHWAY_BASE_REGEX,
  OVERPASS_PUBLIC_ROAD_FILTERS,
  type HighwayInclusionStyle,
} from './highway-filter'
export {
  buildWaysOverpassQuery,
  compileOverpassWaySelector,
  compileOverpassWaySelectors,
  matchesOsmWaySelection,
  matchesOsmWaySelectionSegment,
  tag,
  type OsmTagPredicate,
  type OsmWayFilterClause,
  type OsmWaySelectionPolicy,
} from './way-selection-policy'
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
export { mirrorTags } from './traversal/mirror-tags'
export {
  type CandidateFilter,
  filterNeighborCandidates,
  getEndpointNodeId,
  getKindKey,
  pickBestNeighbor,
  sameKind,
  scoreNeighborCandidate,
} from './traversal/neighborMatch'
