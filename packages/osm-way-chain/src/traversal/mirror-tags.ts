const LEFT_RIGHT_RE = /:(left|right)(:|$)/g
const FORWARD_BACKWARD_RE = /:(forward|backward)(:|$)/g
const START_END_RE = /:(start|end)(:|$)/g

const ONEWAY_FORWARD = new Set(['yes', 'true', '1'])
const ONEWAY_REVERSE = new Set(['-1', 'reverse'])

const TURN_SWAP: Record<string, string> = {
  left: 'right',
  right: 'left',
  slight_left: 'slight_right',
  slight_right: 'slight_left',
  sharp_left: 'sharp_right',
  sharp_right: 'sharp_left',
  merge_to_left: 'merge_to_right',
  merge_to_right: 'merge_to_left',
}

const PLACEMENT_RE = /^(left_of|right_of|middle_of):(\d+)$/i

function mirrorDirectionalKey(key: string): string {
  return key
    .replace(LEFT_RIGHT_RE, (_match, side: string, suffix: string) => {
      const swapped = side === 'left' ? 'right' : 'left'
      return `:${swapped}${suffix}`
    })
    .replace(FORWARD_BACKWARD_RE, (_match, dir: string, suffix: string) => {
      const swapped = dir === 'forward' ? 'backward' : 'forward'
      return `:${swapped}${suffix}`
    })
    .replace(START_END_RE, (_match, pos: string, suffix: string) => {
      const swapped = pos === 'start' ? 'end' : 'start'
      return `:${swapped}${suffix}`
    })
}

function isOnewayKey(key: string): boolean {
  const lower = key.toLowerCase()
  return lower === 'oneway' || lower.startsWith('oneway:')
}

function mirrorOnewayValue(value: string): string {
  const lower = value.trim().toLowerCase()
  if (ONEWAY_FORWARD.has(lower)) return '-1'
  if (ONEWAY_REVERSE.has(lower)) return 'yes'
  return value
}

function isLanesPipeKey(key: string): boolean {
  return key.toLowerCase().includes(':lanes')
}

function mirrorTurnPart(part: string): string {
  const lower = part.trim().toLowerCase()
  return TURN_SWAP[lower] ?? part
}

function mirrorTurnToken(token: string): string {
  return token
    .split(';')
    .map((part) => mirrorTurnPart(part))
    .join(';')
}

function mirrorChangeToken(token: string): string {
  const lower = token.trim().toLowerCase()
  if (lower === 'not_left') return 'not_right'
  if (lower === 'not_right') return 'not_left'
  return token
}

function mirrorLanesPipeValue(key: string, value: string): string {
  const lowerKey = key.toLowerCase()
  const tokens = value.split('|')
  const reversed = [...tokens].reverse()

  if (lowerKey.includes('turn:lanes')) {
    return reversed.map(mirrorTurnToken).join('|')
  }
  if (lowerKey.includes('change:lanes')) {
    return reversed.map(mirrorChangeToken).join('|')
  }
  return reversed.join('|')
}

function mirrorBareSideValue(value: string): string {
  const lower = value.trim().toLowerCase()
  if (lower === 'left') return 'right'
  if (lower === 'right') return 'left'
  return value
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (value == null || value === '') return undefined
  const n = Number.parseInt(value.trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function laneCountForPlacement(tags: Record<string, string>): number {
  const lanes = parsePositiveInt(tags.lanes)
  if (lanes != null) return lanes
  const fwd = parsePositiveInt(tags['lanes:forward']) ?? 0
  const back = parsePositiveInt(tags['lanes:backward']) ?? 0
  const both = parsePositiveInt(tags['lanes:both_ways']) ?? 0
  const sum = fwd + back + both
  return sum > 0 ? sum : 0
}

function mirrorPlacementValue(value: string, laneCount: number): string {
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'transition') return value

  const match = PLACEMENT_RE.exec(trimmed)
  if (!match) return value

  const kind = match[1]!.toLowerCase()
  const lane = Number.parseInt(match[2]!, 10)
  if (!Number.isInteger(lane) || lane < 1) return value

  const total = laneCount > 0 ? laneCount : lane
  const mirroredLane = total + 1 - lane

  if (kind === 'left_of') return `right_of:${mirroredLane}`
  if (kind === 'right_of') return `left_of:${mirroredLane}`
  if (kind === 'middle_of') return `middle_of:${mirroredLane}`
  return value
}

function isPlacementKey(key: string): boolean {
  const lower = key.toLowerCase()
  return lower === 'placement' || lower.startsWith('placement:')
}

function isBareSideKey(key: string): boolean {
  const lower = key.toLowerCase()
  return lower === 'sidewalk' || lower === 'cycleway' || lower === 'busway'
}

function mirrorTagValue(
  key: string,
  value: string,
  tags: Record<string, string>,
  laneCount: number,
): string {
  if (isOnewayKey(key)) return mirrorOnewayValue(value)
  if (isPlacementKey(key)) return mirrorPlacementValue(value, laneCount)
  if (isBareSideKey(key)) return mirrorBareSideValue(value)
  if (isLanesPipeKey(key)) return mirrorLanesPipeValue(key, value)
  return value
}

/**
 * Mirror OSM tags as if the way were digitised in the opposite direction.
 * Applying twice returns the original tags (deep equality).
 */
export function mirrorTags(tags: Record<string, string>): Record<string, string> {
  const laneCount = laneCountForPlacement(tags)
  const mirrored: Record<string, string> = {}

  for (const [key, value] of Object.entries(tags)) {
    const mirroredKey = mirrorDirectionalKey(key)
    mirrored[mirroredKey] = mirrorTagValue(key, value, tags, laneCount)
  }

  return mirrored
}
