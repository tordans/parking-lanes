import type { LaneDirection, LaneSlot } from '@osm-editor-kit/osm-lanes'

const DIRECTION_ORDER: LaneDirection[] = ['backward', 'both_ways', 'forward']

function slotsForDirection(slots: LaneSlot[], direction: LaneDirection): LaneSlot[] {
  const dirSlots = slots
    .filter((slot) => slot.direction === direction)
    .sort((a, b) => a.index - b.index)

  if (direction === 'backward') return [...dirSlots].reverse()
  return dirSlots
}

/** Physical left-to-right cross-section facing along the segment's forward direction. */
export function crossSectionDisplaySlots(slots: LaneSlot[]): LaneSlot[] {
  return DIRECTION_ORDER.flatMap((direction) => slotsForDirection(slots, direction))
}

export function slotKey(slot: LaneSlot): string {
  return `${slot.direction}:${slot.index}`
}

export function parseSlotKey(key: string): { direction: LaneDirection; index: number } | null {
  const match = /^(\w+):(\d+)$/.exec(key)
  if (!match) return null
  const direction = match[1] as LaneDirection
  const index = Number.parseInt(match[2]!, 10)
  if (!Number.isFinite(index)) return null
  return { direction, index }
}
