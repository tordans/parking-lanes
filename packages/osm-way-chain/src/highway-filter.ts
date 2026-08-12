import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { Segment } from './domain/types'
import {
  compileOverpassWaySelector,
  matchesOsmWaySelection,
  tag,
  type OsmWaySelectionPolicy,
} from './way-selection-policy'

/**
 * @deprecated App-owned concept. Prefer {@link OsmWaySelectionPolicy} defined in the app.
 * Kept temporarily for street-space-editor call sites.
 */
export type HighwayInclusionStyle = 'public' | 'inclusive'

/** @deprecated Prefer app-owned policies. */
export const DEFAULT_HIGHWAY_INCLUSION_STYLE: HighwayInclusionStyle = 'public'

/**
 * @deprecated Prefer app-owned {@link OsmWaySelectionPolicy}.
 * Legacy lane-mode car/road selection (incl. `*_link` and `busway`).
 */
export function createLegacyStreetRoadWayPolicy(
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): OsmWaySelectionPolicy {
  const highway = tag.regex(
    'highway',
    '^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$|^busway$',
  )

  if (style === 'inclusive') {
    return { include: [{ all: [highway] }] }
  }

  return {
    include: [{ all: [highway] }],
    globalAll: [
      tag.neq('access', 'private'),
      tag.noneOf('service', ['emergency_access', 'parking_aisle', 'driveway']),
    ],
  }
}

/** @deprecated Prefer matching against an app policy. */
export const ROAD_LIKE_HIGHWAY_BASE_REGEX =
  /^motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service/

/** @deprecated Prefer policy `globalAll`. */
export const OVERPASS_PUBLIC_ROAD_FILTERS =
  '[service!=emergency_access][service!=parking_aisle][service!=driveway][access!=private]'

/**
 * @deprecated Prefer {@link compileOverpassWaySelector} with an app policy.
 * Returns the legacy fragment expected by `way[${tag}]` callers (no leading `[`).
 */
export function overpassRoadLikeSelector(
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): string {
  return compileOverpassWaySelector(createLegacyStreetRoadWayPolicy(style)).slice(1)
}

/** @deprecated Prefer app policy + {@link matchesOsmWaySelection}. */
export function isClutterAccessWay(tags: OsmTags): boolean {
  if (tags.access === 'private') return true
  const service = tags.service
  return service === 'driveway' || service === 'emergency_access' || service === 'parking_aisle'
}

/** @deprecated Prefer app policy + {@link matchesOsmWaySelection}. */
export function matchesHighwayInclusionStyle(
  tags: OsmTags,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  if (style === 'inclusive') return true
  return !isClutterAccessWay(tags)
}

/** @deprecated Prefer app policy + {@link matchesOsmWaySelection}. */
export function isRoadLikeHighway(tags: OsmTags): boolean {
  return matchesOsmWaySelection(tags, createLegacyStreetRoadWayPolicy('inclusive'))
}

/** @deprecated Prefer app policy + {@link matchesOsmWaySelection}. */
export function isEditableRoadLikeHighway(
  tags: OsmTags,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  return matchesOsmWaySelection(tags, createLegacyStreetRoadWayPolicy(style))
}

/** @deprecated Prefer app policy + {@link matchesOsmWaySelectionSegment}. */
export function isRoadLikeSegment(segment: Segment): boolean {
  return isRoadLikeHighway(segment.tags)
}

/** @deprecated Prefer app policy + {@link matchesOsmWaySelectionSegment}. */
export function isEditableRoadLikeSegment(
  segment: Segment,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  return isEditableRoadLikeHighway(segment.tags, style)
}
