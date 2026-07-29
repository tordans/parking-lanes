import type { RoadSpaceSlot } from './types'

export type PlacementKind = 'left_of' | 'right_of' | 'middle_of' | 'transition'

export type Placement =
  | { kind: 'left_of' | 'right_of' | 'middle_of'; lane: number }
  | { kind: 'transition' }

const PLACEMENT_RE = /^(left_of|right_of|middle_of):(\d+)$/i

export function parsePlacement(value: string | undefined): Placement | null {
  if (value == null || value === '') return null
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'transition') return { kind: 'transition' }
  const match = PLACEMENT_RE.exec(trimmed)
  if (!match) return null
  const lane = Number.parseInt(match[2]!, 10)
  if (!Number.isInteger(lane) || lane < 1) return null
  return { kind: match[1] as 'left_of' | 'right_of' | 'middle_of', lane }
}

/**
 * SRK defaults when placement is absent:
 * odd lane count → middle_of:ceil(n/2); even → left_of:(n/2 + 1).
 * `transition` falls back to the same default anchor when neighbours are unknown.
 */
export function resolvePlacement(tags: Record<string, string>, laneCount: number): Placement {
  const parsed = parsePlacement(tags.placement)
  if (parsed && parsed.kind !== 'transition') return parsed
  if (laneCount <= 0) return { kind: 'middle_of', lane: 1 }
  if (laneCount % 2 === 1) {
    return { kind: 'middle_of', lane: Math.ceil(laneCount / 2) }
  }
  return { kind: 'left_of', lane: laneCount / 2 + 1 }
}

/**
 * Distance from the left edge of the LTR carriageway stack to the OSM centreline.
 * Lane numbering is 1-based left-to-right over `slots` (typically carriageway only).
 */
export function centrelineOffsetM(slots: RoadSpaceSlot[], placement: Placement): number {
  if (slots.length === 0) return 0

  const total = slots.reduce((sum, s) => sum + s.widthM, 0)
  if (placement.kind === 'transition') {
    return total / 2
  }

  const lane = Math.min(Math.max(1, placement.lane), slots.length)
  let offset = 0
  for (let i = 0; i < lane - 1; i++) {
    offset += slots[i]!.widthM
  }
  const laneWidth = slots[lane - 1]!.widthM
  if (placement.kind === 'left_of') return offset
  if (placement.kind === 'right_of') return offset + laneWidth
  return offset + laneWidth / 2
}
