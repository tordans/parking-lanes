/** Lane tagging completeness for map QA styling. */
export type LaneCompleteness = 'none' | 'count-only' | 'rich'

const COUNT_KEYS = ['lanes', 'lanes:forward', 'lanes:backward', 'lanes:both_ways'] as const

const RICH_PIPE_KEYS = [
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
] as const

export function laneCompleteness(tags: Record<string, string>): LaneCompleteness {
  const hasCount = COUNT_KEYS.some((key) => tags[key] != null && tags[key] !== '')
  if (!hasCount) return 'none'

  const hasRich = RICH_PIPE_KEYS.some((key) => tags[key] != null && tags[key] !== '')
  return hasRich ? 'rich' : 'count-only'
}

export function isDeemphasizedHighway(highway: string): boolean {
  return highway === 'service' || highway === 'living_street'
}
