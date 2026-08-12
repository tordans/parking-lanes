import {
  tag,
  type HighwayInclusionStyle,
  type OsmWaySelectionPolicy,
} from '@osm-editor-kit/osm-way-chain'

/**
 * Lane-mode car/road way policy for street-space-editor.
 * App-owned contract passed into `@osm-editor-kit/osm-way-chain` compile/match helpers.
 */
export function streetSpaceWayPolicy(
  style: HighwayInclusionStyle = 'public',
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
