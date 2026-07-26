import { getDrivingSideFromTags } from './driving-side'
import { buildSlotsFromTags, resolveDirectionCounts } from './slots'
import { collectSecondaryTags, isOneway } from './tags'
import type { WayLaneModel } from './types'
import { validateWayLanes } from './validate'

export function parseWayLanes(tags: Record<string, string>): WayLaneModel {
  const oneway = isOneway(tags)
  const drivingSide = getDrivingSideFromTags(tags)
  const counts = resolveDirectionCounts(tags, oneway)
  const slots = buildSlotsFromTags(tags, drivingSide)
  const secondary = collectSecondaryTags(tags)

  const laneMarkingsRaw = tags.lane_markings?.toLowerCase()
  const laneMarkings =
    laneMarkingsRaw === 'yes' || laneMarkingsRaw === 'no' ? laneMarkingsRaw : undefined

  const model: WayLaneModel = {
    slots,
    laneMarkings,
    oneway: tags.oneway,
    placement: tags.placement,
    placementForward: tags['placement:forward'],
    placementBackward: tags['placement:backward'],
    lanesTotal: counts.lanesTotal,
    lanesForward: counts.lanesForward,
    lanesBackward: counts.lanesBackward,
    lanesBothWays: counts.lanesBothWays,
    secondary,
    warnings: [],
  }

  model.warnings = validateWayLanes(model, tags)
  return model
}
