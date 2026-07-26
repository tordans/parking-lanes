import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { Segment } from './domain/types'

/**
 * Base highway values used for lane-mode street chain traversal.
 * Link variants (`*_link`) and `highway=busway` are handled separately.
 */
export const ROAD_LIKE_HIGHWAY_BASE_REGEX =
  /^motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service/

/** Whether OSM tags describe a road-like highway suitable for lane-mode chaining. */
export function isRoadLikeHighway(tags: OsmTags): boolean {
  const highway = tags.highway
  if (!highway) return false
  if (highway === 'busway') return true

  const base = highway.endsWith('_link') ? highway.slice(0, -'_link'.length) : highway
  return ROAD_LIKE_HIGHWAY_BASE_REGEX.test(base)
}

/** Segment-level predicate for `buildChain` / `filterNeighborCandidates`. */
export function isRoadLikeSegment(segment: Segment): boolean {
  return isRoadLikeHighway(segment.tags)
}
