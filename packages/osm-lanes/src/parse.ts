import { mirrorTags } from '@osm-editor-kit/osm-way-chain'
import { getDrivingSideFromTags } from './driving-side'
import { buildSlotsFromTags, resolveDirectionCounts } from './slots'
import { collectSecondaryTags, isOneway } from './tags'
import type { WayLaneModel } from './types'
import { validateWayLanes } from './validate'

function isReverseOneway(tags: Record<string, string>): boolean {
  const oneway = tags.oneway?.toLowerCase()
  return oneway === '-1' || oneway === 'reverse'
}

/** Tags after reverse-oneway remirror — same input `parseWayLanes` uses internally. */
export function effectiveTagsForParse(tags: Record<string, string>): Record<string, string> {
  return isReverseOneway(tags) ? mirrorTags(tags) : tags
}

export function parseWayLanes(tags: Record<string, string>): WayLaneModel {
  const effectiveTags = effectiveTagsForParse(tags)
  const oneway = isOneway(effectiveTags)
  const drivingSide = getDrivingSideFromTags(effectiveTags)
  const counts = resolveDirectionCounts(effectiveTags, oneway)
  const slots = buildSlotsFromTags(effectiveTags, drivingSide)
  const secondary = collectSecondaryTags(effectiveTags)

  const laneMarkingsRaw = effectiveTags.lane_markings?.toLowerCase()
  const laneMarkings =
    laneMarkingsRaw === 'yes' || laneMarkingsRaw === 'no' ? laneMarkingsRaw : undefined

  const model: WayLaneModel = {
    slots,
    laneMarkings,
    oneway: effectiveTags.oneway,
    placement: effectiveTags.placement,
    placementForward: effectiveTags['placement:forward'],
    placementBackward: effectiveTags['placement:backward'],
    lanesTotal: counts.lanesTotal,
    lanesForward: counts.lanesForward,
    lanesBackward: counts.lanesBackward,
    lanesBothWays: counts.lanesBothWays,
    secondary,
    warnings: [],
  }

  model.warnings = validateWayLanes(model, effectiveTags)
  return model
}
