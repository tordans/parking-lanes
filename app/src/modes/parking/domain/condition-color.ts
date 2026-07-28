import { getOpeningHourseState } from '@osm-editor-kit/osm-tag-syntax'
import { type ConditionColor, type ParkingConditions } from '../../../utils/types/conditions'
import { legend } from '../legend'

export function getColor(condition: string | null | undefined): ConditionColor | undefined {
  if (!condition) return undefined

  for (const element of legend) {
    if (condition === element.condition) return element.color
  }
}

/** Active parking condition at `datetime` (conditional intervals, else default). */
export function getConditionByDate(conditions: ParkingConditions, datetime: Date): string | null {
  if (!conditions) return null

  for (const interval of conditions.conditionalValues ?? []) {
    if (interval.condition && getOpeningHourseState(interval.condition, datetime)) {
      const condition =
        interval.parkingCondition === 'default' ? conditions.default : interval.parkingCondition
      return condition ?? null
    }
  }
  return conditions.default ?? null
}

export function getColorByDate(
  conditions: ParkingConditions,
  datetime: Date,
): ConditionColor | undefined {
  if (!conditions) return 'black'
  return getColor(getConditionByDate(conditions, datetime))
}
