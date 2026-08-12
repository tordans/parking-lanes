import type { OsmTags } from '@osm-editor-kit/osm-data'
import {
  matchesOsmWaySelection,
  matchesOsmWaySelectionSegment,
  tag,
  type OsmWaySelectionPolicy,
  type Segment,
} from '@osm-editor-kit/osm-way-chain'

/** URL / UI toggle for low-priority access roads. */
export type HighwayInclusionStyle = 'public' | 'inclusive'

export const DEFAULT_HIGHWAY_INCLUSION_STYLE: HighwayInclusionStyle = 'public'

/** Car/road highway classes used by lane-mode chaining and parking lanes (incl. links + busway). */
export const STREET_ROAD_HIGHWAY_REGEX =
  /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service)(_link)?$|^busway$/

const clutterExclusions = [
  tag.neq('access', 'private'),
  tag.noneOf('service', ['emergency_access', 'parking_aisle', 'driveway']),
] as const

/**
 * Lane-mode car/road way policy for street-space-editor.
 * App-owned contract passed into `@osm-editor-kit/osm-way-chain` compile/match helpers.
 */
export function streetSpaceWayPolicy(
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): OsmWaySelectionPolicy {
  const highway = tag.regex('highway', STREET_ROAD_HIGHWAY_REGEX.source)

  if (style === 'inclusive') {
    return { include: [{ all: [highway] }] }
  }

  return {
    include: [{ all: [highway] }],
    globalAll: [...clutterExclusions],
  }
}

/**
 * Access/clutter filter only (any `highway=*`).
 * Used by width / bicycle / surface overlays that are not limited to car roads.
 */
export function streetSpaceInclusionPolicy(
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): OsmWaySelectionPolicy {
  if (style === 'inclusive') {
    return { include: [{ all: [] }] }
  }
  return {
    include: [{ all: [] }],
    globalAll: [...clutterExclusions],
  }
}

export function matchesStreetSpaceWay(
  tags: OsmTags,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  return matchesOsmWaySelection(tags, streetSpaceWayPolicy(style))
}

export function matchesStreetSpaceInclusion(
  tags: OsmTags,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  return matchesOsmWaySelection(tags, streetSpaceInclusionPolicy(style))
}

export function matchesStreetSpaceWaySegment(
  segment: Segment,
  style: HighwayInclusionStyle = DEFAULT_HIGHWAY_INCLUSION_STYLE,
): boolean {
  return matchesOsmWaySelectionSegment(segment, streetSpaceWayPolicy(style))
}
