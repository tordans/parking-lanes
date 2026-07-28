import * as m from '@app/paraglide/messages'
import { bicycleLegendItems } from '../modes/bicycle/map/bicycle-colors'
import { lanesLegendItems } from '../modes/lanes/map/lanes-legend-colors'
import { surfaceLegendItems } from '../modes/surface/map/surface-colors'
import { widthLegendItems } from '../modes/width/map/width-colors'
import type { ConditionName } from '../utils/types/conditions'

const parkingLegendTextByCondition = {
  free: m.legend_parking_free,
  disc: m.legend_parking_disc,
  no_parking: m.legend_parking_no_parking,
  no_stopping: m.legend_parking_no_stopping,
  no: m.legend_parking_no,
  ticket: m.legend_parking_ticket,
  customers: m.legend_parking_customers,
  residents: m.legend_parking_residents,
  loading_only: m.legend_parking_loading_only,
  disabled: m.legend_parking_disabled,
  unsupported: m.legend_parking_unsupported,
  separate: m.legend_parking_separate,
} as const satisfies Record<ConditionName, () => string>

const bicycleLegendLabelByPaintState = {
  complete: m.legend_bicycle_complete,
  incomplete: m.legend_bicycle_incomplete,
  noInfra: m.legend_missing_data,
  separateGeometry: m.legend_bicycle_separate,
  centerlinePresence: m.legend_bicycle_centerline,
} as const satisfies Record<(typeof bicycleLegendItems)[number]['paintState'], () => string>

const lanesLegendLabelById = {
  none: m.legend_missing_data,
  'count-only': m.legend_lanes_count_only,
  rich: m.legend_lanes_rich,
} as const satisfies Record<(typeof lanesLegendItems)[number]['id'], () => string>

const surfaceLegendLabelById = {
  missing_surface: m.legend_missing_data,
  missing_smoothness: m.legend_surface_smoothness_missing,
  very_bad: m.legend_surface_very_bad,
  bad: m.legend_surface_bad,
  intermediate: m.legend_surface_intermediate,
  good: m.legend_surface_good,
  excellent: m.legend_surface_excellent,
} as const satisfies Record<(typeof surfaceLegendItems)[number]['id'], () => string>

const widthLegendBeforeByKind = {
  explicit: m.legend_width_tagged,
  default: m.legend_width_default_before,
} as const satisfies Record<(typeof widthLegendItems)[number]['kind'], () => string>

export function getParkingLegendText(condition: ConditionName): string {
  return parkingLegendTextByCondition[condition]()
}

/** Legend label for a resolved parking condition, or “Missing data” when unset. */
export function parkingConditionLegendLabel(condition: string | null | undefined): string {
  if (condition == null) return m.legend_missing_data()
  if (Object.hasOwn(parkingLegendTextByCondition, condition)) {
    return parkingLegendTextByCondition[condition as ConditionName]()
  }
  return parkingLegendTextByCondition.unsupported()
}

export function getBicycleLegendItems() {
  return bicycleLegendItems.map((item) => ({
    paintState: item.paintState,
    label: bicycleLegendLabelByPaintState[item.paintState](),
  }))
}

export function getLanesLegendItems() {
  return lanesLegendItems.map((item) => ({
    id: item.id,
    label: lanesLegendLabelById[item.id](),
  }))
}

export function getSurfaceLegendItems() {
  return surfaceLegendItems.map((item) => ({
    id: item.id,
    label: surfaceLegendLabelById[item.id](),
  }))
}

export type WidthLegendKind = (typeof widthLegendItems)[number]['kind']

export function getWidthLegendBefore(kind: WidthLegendKind): string {
  return widthLegendBeforeByKind[kind]()
}

export function getWidthLegendAfter(kind: WidthLegendKind): string | undefined {
  if (kind === 'default') {
    return m.legend_width_default_after()
  }
  return undefined
}
