import { isOneway } from './tags'
import type { LaneDirection, LaneSlot, LaneSlotProvenance, WayLaneModel } from './types'

function taggedProvenance(): LaneSlotProvenance {
  return {
    count: 'tagged',
    turn: 'tagged',
    vehicleAccess: 'tagged',
    bicycleAccess: 'tagged',
    busAccess: 'tagged',
    psvAccess: 'tagged',
    widthMeters: 'tagged',
    change: 'tagged',
    surface: 'tagged',
    smoothness: 'tagged',
    kind: 'tagged',
  }
}

function createDefaultSlot(direction: LaneDirection, index: number): LaneSlot {
  return {
    index,
    direction,
    kind: 'travel',
    turn: 'through',
    vehicleAccess: 'yes',
    bicycleAccess: 'yes',
    provenance: taggedProvenance(),
  }
}

function slotsForDirection(slots: LaneSlot[], direction: LaneDirection): LaneSlot[] {
  return slots.filter((slot) => slot.direction === direction).sort((a, b) => a.index - b.index)
}

function replaceDirectionSlots(
  slots: LaneSlot[],
  direction: LaneDirection,
  nextDirSlots: LaneSlot[],
): LaneSlot[] {
  const other = slots.filter((slot) => slot.direction !== direction)
  return [...other, ...nextDirSlots]
}

export function syncModelCountsFromSlots(model: WayLaneModel): WayLaneModel {
  const oneway = model.oneway != null ? isOneway({ oneway: model.oneway }) : false
  const forward = slotsForDirection(model.slots, 'forward').length
  const backward = slotsForDirection(model.slots, 'backward').length
  const bothWays = slotsForDirection(model.slots, 'both_ways').length

  if (oneway) {
    return {
      ...model,
      lanesForward: forward,
      lanesTotal: forward,
      lanesBackward: 0,
      lanesBothWays: bothWays > 0 ? bothWays : undefined,
    }
  }

  const lanesTotal = forward + backward + bothWays
  return {
    ...model,
    lanesForward: forward > 0 ? forward : undefined,
    lanesBackward: backward > 0 ? backward : undefined,
    lanesBothWays: bothWays > 0 ? bothWays : undefined,
    lanesTotal: lanesTotal > 0 ? lanesTotal : undefined,
  }
}

export function addLaneSlot(model: WayLaneModel, direction: LaneDirection): WayLaneModel {
  const dirSlots = slotsForDirection(model.slots, direction)
  const nextDirSlots = [...dirSlots, createDefaultSlot(direction, dirSlots.length)].map(
    (slot, index) => ({ ...slot, index }),
  )

  const nextModel = {
    ...model,
    slots: replaceDirectionSlots(model.slots, direction, nextDirSlots),
    warnings: [] as WayLaneModel['warnings'],
  }
  return syncModelCountsFromSlots(nextModel)
}

export function removeLaneSlot(
  model: WayLaneModel,
  direction: LaneDirection,
  index: number,
): WayLaneModel | null {
  const dirSlots = slotsForDirection(model.slots, direction)
  if (index < 0 || index >= dirSlots.length) return null

  const nextDirSlots = dirSlots
    .filter((slot) => slot.index !== index)
    .map((slot, slotIndex) => ({ ...slot, index: slotIndex }))

  const nextModel = {
    ...model,
    slots: replaceDirectionSlots(model.slots, direction, nextDirSlots),
    warnings: [] as WayLaneModel['warnings'],
  }
  return syncModelCountsFromSlots(nextModel)
}

export function slotHasRichData(slot: LaneSlot): boolean {
  if (slot.turn != null && slot.turn !== '' && slot.turn !== 'through') return true
  if (slot.vehicleAccess != null && slot.vehicleAccess !== 'yes') return true
  if (slot.bicycleAccess != null && slot.bicycleAccess !== 'yes') return true
  if (slot.busAccess != null && slot.busAccess !== '') return true
  if (slot.psvAccess != null && slot.psvAccess !== '') return true
  if (slot.widthMeters != null) return true
  if (slot.change != null && slot.change !== '') return true
  if (slot.surface != null && slot.surface !== '') return true
  if (slot.smoothness != null && slot.smoothness !== '') return true
  if (slot.kind !== 'travel') return true
  return false
}

export function editableLaneDirections(model: WayLaneModel): LaneDirection[] {
  const oneway = model.oneway != null ? isOneway({ oneway: model.oneway }) : false
  if (oneway) return ['forward']
  return ['forward', 'backward']
}
