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
