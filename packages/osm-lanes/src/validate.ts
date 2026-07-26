import { splitLanesPipe } from './pipe'
import { isOneway, readDirectionalTag } from './tags'
import type { LaneDirection, LaneSlot, LaneWarning, WayLaneModel } from './types'
import { LANE_DIRECTIONS } from './types'

function slotsForDirection(slots: LaneSlot[], direction: LaneDirection): LaneSlot[] {
  return slots.filter((s) => s.direction === direction)
}

function parsePlacementIndex(placement: string | undefined): number | undefined {
  if (!placement) return undefined
  const middle = /^middle_of:(\d+)$/i.exec(placement)
  if (middle) return Number.parseInt(middle[1]!, 10)
  const rightOf = /^right_of:(\d+)$/i.exec(placement)
  if (rightOf) return Number.parseInt(rightOf[1]!, 10) + 1
  const leftOf = /^left_of:(\d+)$/i.exec(placement)
  if (leftOf) return Number.parseInt(leftOf[1]!, 10) - 1
  return undefined
}

function countBikeSlots(slots: LaneSlot[]): number {
  return slots.filter((s) => {
    const bike = s.bicycleAccess?.toLowerCase()
    return bike === 'designated' || bike === 'yes' || s.kind === 'bicycle'
  }).length
}

export function validateWayLanes(
  model: WayLaneModel,
  tags: Record<string, string> = {},
): LaneWarning[] {
  const warnings: LaneWarning[] = []
  const oneway = model.oneway != null ? isOneway({ oneway: model.oneway }) : isOneway(tags)
  const useDirectional = !oneway

  const directionalSum =
    (model.lanesForward ?? 0) + (model.lanesBackward ?? 0) + (model.lanesBothWays ?? 0)
  if (
    model.lanesTotal != null &&
    !oneway &&
    (model.lanesForward != null || model.lanesBackward != null || model.lanesBothWays != null) &&
    directionalSum !== model.lanesTotal
  ) {
    warnings.push({
      code: 'lanes_sum_mismatch',
      message: `lanes=${model.lanesTotal} but forward+backward+both_ways=${directionalSum}`,
      severity: 'error',
    })
  }

  const directions: LaneDirection[] = oneway ? ['forward'] : LANE_DIRECTIONS
  for (const direction of directions) {
    const dirSlots = slotsForDirection(model.slots, direction)
    const declared =
      direction === 'forward'
        ? model.lanesForward
        : direction === 'backward'
          ? model.lanesBackward
          : model.lanesBothWays

    if (declared != null && dirSlots.length > 0 && dirSlots.length !== declared) {
      warnings.push({
        code: 'pipe_count_mismatch',
        message: `lanes:${direction}=${declared} but ${dirSlots.length} pipe slot(s)`,
        severity: 'warning',
      })
    }

    const turnPipe = readDirectionalTag(tags, 'turn:lanes', direction, useDirectional)
    const bicyclePipe = readDirectionalTag(tags, 'bicycle:lanes', direction, useDirectional)
    const turnLen = splitLanesPipe(turnPipe).length
    const bikeLen = splitLanesPipe(bicyclePipe).length
    if (turnLen > 0 && bikeLen > 0 && turnLen !== bikeLen) {
      warnings.push({
        code: 'pipe_length_mismatch',
        message: `turn:lanes (${turnLen}) and bicycle:lanes (${bikeLen}) differ for ${direction}`,
        severity: 'warning',
      })
    }
  }

  const motorSlots = model.slots.filter((s) => s.direction !== 'both_ways')
  const bikeInPipes = countBikeSlots(model.slots)
  const motorDeclared = (model.lanesForward ?? 0) + (model.lanesBackward ?? 0) || model.lanesTotal
  if (
    motorDeclared != null &&
    bikeInPipes > 0 &&
    motorSlots.length > motorDeclared &&
    motorSlots.length - bikeInPipes <= motorDeclared
  ) {
    warnings.push({
      code: 'bike_lanes_count_inconsistency',
      message:
        'bicycle lanes appear in :lanes pipes but are excluded from lanes=* count (common DE/EU pattern)',
      severity: 'warning',
    })
  }

  const placementChecks: Array<{ key: string; placement?: string; direction: LaneDirection }> = [
    { key: 'placement', placement: model.placement, direction: 'forward' },
    { key: 'placement:forward', placement: model.placementForward, direction: 'forward' },
    { key: 'placement:backward', placement: model.placementBackward, direction: 'backward' },
  ]

  for (const { key, placement, direction } of placementChecks) {
    if (!placement) continue
    const idx = parsePlacementIndex(placement)
    if (idx == null) continue
    const dirSlots = slotsForDirection(model.slots, direction)
    const maxIdx = dirSlots.length
    if (maxIdx > 0 && (idx < 1 || idx > maxIdx)) {
      warnings.push({
        code: 'placement_out_of_range',
        message: `${key}=${placement} references lane ${idx} but ${direction} has ${maxIdx} slot(s)`,
        severity: 'warning',
      })
    }
  }

  return warnings
}
