import { joinLanesPipe } from './pipe'
import { hasDirectionalLaneCountTags, hasUndirectedLanePipes } from './slots'
import { isOneway, laneTagKey, PRIMARY_LANE_KEYS } from './tags'
import type { LaneDirection, LaneSlot, WayLaneModel } from './types'
import { LANE_DIRECTIONS } from './types'

function slotsForDirection(slots: LaneSlot[], direction: LaneDirection): LaneSlot[] {
  return slots.filter((s) => s.direction === direction).sort((a, b) => a.index - b.index)
}

function formatWidth(meters: number | undefined): string | undefined {
  if (meters == null) return undefined
  return Number.isInteger(meters) ? String(meters) : String(meters)
}

function writePipe(out: Record<string, string>, key: string, values: (string | undefined)[]): void {
  if (values.length === 0) return
  if (values.every((v) => v == null || v === '')) return
  out[key] = joinLanesPipe(values)
}

function serializeDirectionSlots(
  model: WayLaneModel,
  direction: LaneDirection,
  useDirectional: boolean,
): Record<string, string> {
  const dirSlots = slotsForDirection(model.slots, direction)
  if (dirSlots.length === 0) return {}

  const out: Record<string, string> = {}
  writePipe(
    out,
    laneTagKey('turn:lanes', direction, useDirectional),
    dirSlots.map((s) => s.turn),
  )
  writePipe(
    out,
    laneTagKey('vehicle:lanes', direction, useDirectional),
    dirSlots.map((s) => s.vehicleAccess),
  )
  writePipe(
    out,
    laneTagKey('bicycle:lanes', direction, useDirectional),
    dirSlots.map((s) => s.bicycleAccess),
  )
  writePipe(
    out,
    laneTagKey('bus:lanes', direction, useDirectional),
    dirSlots.map((s) => s.busAccess),
  )
  writePipe(
    out,
    laneTagKey('psv:lanes', direction, useDirectional),
    dirSlots.map((s) => s.psvAccess),
  )
  writePipe(
    out,
    laneTagKey('width:lanes', direction, useDirectional),
    dirSlots.map((s) => formatWidth(s.widthMeters)),
  )
  return out
}

function serializeLaneCounts(model: WayLaneModel, oneway: boolean): Record<string, string> {
  const out: Record<string, string> = {}
  if (oneway) {
    const forwardCount = model.lanesForward ?? model.lanesTotal
    if (forwardCount != null) out.lanes = String(forwardCount)
  } else {
    if (model.lanesTotal != null) out.lanes = String(model.lanesTotal)
    if (model.lanesForward != null) out['lanes:forward'] = String(model.lanesForward)
    if (model.lanesBackward != null) out['lanes:backward'] = String(model.lanesBackward)
    if (model.lanesBothWays != null) out['lanes:both_ways'] = String(model.lanesBothWays)
  }
  return out
}

function preferUndirectedPipes(baseTags: Record<string, string>, oneway: boolean): boolean {
  if (oneway) return false
  if (!hasUndirectedLanePipes(baseTags)) return false
  if (hasDirectionalLaneCountTags(baseTags)) return false
  const directionalPipe =
    baseTags['turn:lanes:forward'] != null ||
    baseTags['turn:lanes:backward'] != null ||
    baseTags['bicycle:lanes:forward'] != null ||
    baseTags['bicycle:lanes:backward'] != null
  return !directionalPipe
}

export function serializeWayLanes(
  model: WayLaneModel,
  baseTags: Record<string, string> = {},
): Record<string, string> {
  const oneway = model.oneway != null ? isOneway({ oneway: model.oneway }) : isOneway(baseTags)
  const undirectedPipes = preferUndirectedPipes(baseTags, oneway)
  const useDirectional = !oneway && !undirectedPipes

  const preserved: Record<string, string> = {}
  for (const [key, value] of Object.entries(baseTags)) {
    if (!PRIMARY_LANE_KEYS.has(key)) preserved[key] = value
  }

  const laneTags: Record<string, string> = {
    ...serializeLaneCounts(model, oneway),
  }

  const directions: LaneDirection[] = oneway ? ['forward'] : LANE_DIRECTIONS
  for (const direction of directions) {
    Object.assign(laneTags, serializeDirectionSlots(model, direction, useDirectional))
  }

  if (model.laneMarkings) laneTags.lane_markings = model.laneMarkings
  if (model.oneway != null) laneTags.oneway = model.oneway
  if (model.placement) laneTags.placement = model.placement
  if (model.placementForward) laneTags['placement:forward'] = model.placementForward
  if (model.placementBackward) laneTags['placement:backward'] = model.placementBackward

  return { ...preserved, ...laneTags }
}
