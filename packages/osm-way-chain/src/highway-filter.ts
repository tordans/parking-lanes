import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { Segment } from './domain/types'

/**
 * Base highway values used for lane-mode street chain traversal.
 * Link variants (`*_link`) and `highway=busway` are handled separately.
 */
export const ROAD_LIKE_HIGHWAY_BASE_REGEX =
  /^motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service/

/**
 * How broadly the editor includes low-priority access roads in the map.
 *
 * - `public` (default): skip private access, driveways, emergency access, and parking aisles
 * - `inclusive`: include those ways (previous editor behavior)
 */
export type HighwayInclusionStyle = 'public' | 'inclusive'

export const DEFAULT_HIGHWAY_INCLUSION_STYLE: HighwayInclusionStyle = 'public'

const CLUTTER_SERVICE_VALUES = new Set(['driveway', 'emergency_access', 'parking_aisle'])

export const OVERPASS_PUBLIC_ROAD_FILTERS =
  '[service!=emergency_access][service!=parking_aisle][service!=driveway][access!=private]'

/** Overpass selector for road-like ways under the given inclusion style. */
export function overpassRoadLikeSelector(
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): string {
  const base =
    'highway~"^motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street"'
  if (style === 'inclusive') return base
  return base + OVERPASS_PUBLIC_ROAD_FILTERS
}

/** Ways that are usually noise in street-space editing (private driveways, etc.). */
export function isClutterAccessWay(tags: OsmTags): boolean {
  if (tags.access === 'private') return true
  const service = tags.service
  return service != null && CLUTTER_SERVICE_VALUES.has(service)
}

/** Whether a way should be shown/edited under the chosen inclusion style. */
export function matchesHighwayInclusionStyle(
  tags: OsmTags,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  if (style === 'inclusive') return true
  return !isClutterAccessWay(tags)
}

/** Whether OSM tags describe a road-like highway suitable for lane-mode chaining. */
export function isRoadLikeHighway(tags: OsmTags): boolean {
  const highway = tags.highway
  if (!highway) return false
  if (highway === 'busway') return true

  const base = highway.endsWith('_link') ? highway.slice(0, -'_link'.length) : highway
  return ROAD_LIKE_HIGHWAY_BASE_REGEX.test(base)
}

/** Road-like highways that pass the active inclusion style. */
export function isEditableRoadLikeHighway(
  tags: OsmTags,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  return isRoadLikeHighway(tags) && matchesHighwayInclusionStyle(tags, style)
}

/** Segment-level predicate for `buildChain` / `filterNeighborCandidates`. */
export function isRoadLikeSegment(segment: Segment): boolean {
  return isRoadLikeHighway(segment.tags)
}

/** Segment-level predicate that also applies the editor inclusion style. */
export function isEditableRoadLikeSegment(
  segment: Segment,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  return isEditableRoadLikeHighway(segment.tags, style)
}
