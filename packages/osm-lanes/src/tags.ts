import type { LaneDirection } from './types'

export type DirectionSuffix = '' | ':forward' | ':backward' | ':both_ways'

export function isOneway(tags: Record<string, string>): boolean {
  const oneway = tags.oneway?.toLowerCase()
  if (oneway === 'yes' || oneway === '1' || oneway === 'true') return true
  if (oneway === '-1' || oneway === 'reverse') return true
  if (tags.junction?.toLowerCase() === 'roundabout') return true
  return false
}

export function directionSuffix(direction: LaneDirection): DirectionSuffix {
  if (direction === 'forward') return ':forward'
  if (direction === 'backward') return ':backward'
  return ':both_ways'
}

export function laneTagKey(
  base: string,
  direction: LaneDirection,
  useDirectional: boolean,
): string {
  if (!useDirectional) return base
  return `${base}${directionSuffix(direction)}`
}

export function collectSecondaryTags(tags: Record<string, string>) {
  const destinationLanes: Record<string, string> = {}
  const changeLanes: Record<string, string> = {}
  const maxspeedLanes: Record<string, string> = {}
  const cyclewayLanes: Record<string, string> = {}

  for (const [key, value] of Object.entries(tags)) {
    if (key === 'destination:lanes' || key.startsWith('destination:lanes:')) {
      destinationLanes[key] = value
    } else if (key === 'change:lanes' || key.startsWith('change:lanes:')) {
      changeLanes[key] = value
    } else if (key === 'maxspeed:lanes' || key.startsWith('maxspeed:lanes:')) {
      maxspeedLanes[key] = value
    } else if (key === 'cycleway:lanes' || key.startsWith('cycleway:lanes:')) {
      cyclewayLanes[key] = value
    }
  }

  const secondary =
    Object.keys(destinationLanes).length > 0 ||
    Object.keys(changeLanes).length > 0 ||
    Object.keys(maxspeedLanes).length > 0 ||
    Object.keys(cyclewayLanes).length > 0
      ? { destinationLanes, changeLanes, maxspeedLanes, cyclewayLanes }
      : undefined

  return secondary
}

/** Primary lane keys managed by serialize (stripped before merge). */
export const PRIMARY_LANE_KEYS = new Set([
  'lanes',
  'lanes:forward',
  'lanes:backward',
  'lanes:both_ways',
  'lanes:bus',
  'lanes:bus:forward',
  'lanes:bus:backward',
  'lanes:bus:both_ways',
  'lanes:psv',
  'lanes:psv:forward',
  'lanes:psv:backward',
  'lanes:psv:both_ways',
  'turn:lanes',
  'turn:lanes:forward',
  'turn:lanes:backward',
  'turn:lanes:both_ways',
  'vehicle:lanes',
  'vehicle:lanes:forward',
  'vehicle:lanes:backward',
  'vehicle:lanes:both_ways',
  'bicycle:lanes',
  'bicycle:lanes:forward',
  'bicycle:lanes:backward',
  'bicycle:lanes:both_ways',
  'bus:lanes',
  'bus:lanes:forward',
  'bus:lanes:backward',
  'bus:lanes:both_ways',
  'psv:lanes',
  'psv:lanes:forward',
  'psv:lanes:backward',
  'psv:lanes:both_ways',
  'width:lanes',
  'width:lanes:forward',
  'width:lanes:backward',
  'width:lanes:both_ways',
  'lane_markings',
  'oneway',
  'placement',
  'placement:forward',
  'placement:backward',
])

export function readDirectionalTag(
  tags: Record<string, string>,
  base: string,
  direction: LaneDirection,
  useDirectional: boolean,
): string | undefined {
  if (useDirectional) {
    const directional = tags[laneTagKey(base, direction, true)]
    if (directional != null) return directional
  }
  if (direction === 'forward' || !useDirectional) {
    return tags[base]
  }
  return undefined
}
