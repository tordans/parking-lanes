import { parseConditionalTag } from '../../utils/conditional-tag'
import { parseOpeningHours } from '../../utils/opening-hours'
import {
  type ConditionalParkingCondition,
  type ParkingConditions,
} from '../../utils/types/conditions'
import { type OsmTags } from '../../utils/types/osm-data'
import { legend } from '../legend'

export function getLaneSchemeConditions(side: 'left' | 'right', tags: OsmTags): ParkingConditions {
  const conditions: ParkingConditions = { conditionalValues: [], default: null }

  conditions.conditionalValues = parseConditionsBySchemeV2(side, tags)
  if (conditions.conditionalValues.length > 0) {
    conditions.default = parseDefaultCondition(side, tags, 0)
  } else {
    conditions.conditionalValues = parseConditionsBySchemeV1(side, tags)
    conditions.default = parseDefaultCondition(side, tags, conditions.conditionalValues.length)
  }
  return conditions
}

export function parseDefaultCondition(
  side: string,
  tags: OsmTags,
  findedBySchemeV1IntervalsCount: number,
) {
  const sides = [side, 'both']

  const laneTag = sides.map((side) => 'parking:lane:' + side).find((tag) => tags[tag])
  const conditionTag = sides.map((side) => 'parking:condition:' + side).find((tag) => tags[tag])
  const defalutConditionTag = sides
    .map((side) => 'parking:condition:' + side + ':default')
    .find((tag) => tags[tag])

  const tag =
    findedBySchemeV1IntervalsCount === 0
      ? (conditionTag ??
        (laneTag && legend.some((x) => x.condition === tags[laneTag]) ? laneTag : null) ??
        defalutConditionTag)
      : (defalutConditionTag ?? laneTag)
  const condition = tag ? tags[tag] : null
  const conditionInLegend = condition ? legend.some((x) => x.condition === condition) : false

  if (conditionInLegend) return condition

  if (condition) return 'unsupported'

  if (
    !condition &&
    laneTag &&
    ['parallel', 'diagonal', 'perpendicular', 'marked', 'yes'].includes(tags[laneTag])
  )
    return 'free'

  return null
}

export function parseConditionsBySchemeV2(side: string, tags: OsmTags) {
  const conditionalTag = [side, 'both']
    .map((side) => 'parking:condition:' + side + ':conditional')
    .find((tag) => tags[tag])

  if (!conditionalTag) return []

  const intervals: ConditionalParkingCondition[] = parseConditionalTag(tags[conditionalTag]).map(
    (x) => ({
      parkingCondition: x.value,
      condition: parseOpeningHours(x.condition),
    }),
  )

  return intervals
}

export function parseConditionsBySchemeV1(side: string, tags: OsmTags) {
  const conditionalParkingConditions: ConditionalParkingCondition[] = []
  const sides = ['both', side]

  for (let i = 1; i < 10; i++) {
    const index = i > 1 ? ':' + i : ''

    const laneTags = sides.map((side) => 'parking:lane:' + side + index)
    const conditionTags = sides.map((side) => 'parking:condition:' + side + index)
    const intervalTags = sides.map((side) => 'parking:condition:' + side + index + ':time_interval')

    const conditionalParkingCondition: ConditionalParkingCondition = {
      parkingCondition: null,
      condition: null,
    }

    for (let j = 0; j < sides.length; j++) {
      let tagValue = tags[laneTags[j]]
      if (tagValue && legend.findIndex((x) => x.condition === tagValue) >= 0)
        conditionalParkingCondition.parkingCondition = tagValue

      tagValue = tags[conditionTags[j]]
      if (tagValue) conditionalParkingCondition.parkingCondition = tagValue

      tagValue = tags[intervalTags[j]]
      if (tagValue) conditionalParkingCondition.condition = parseOpeningHours(tagValue)
    }

    if (i === 1 && conditionalParkingCondition.condition == null) break

    if (conditionalParkingCondition.parkingCondition)
      conditionalParkingConditions?.push(conditionalParkingCondition)
    else break
  }

  return conditionalParkingConditions
}
