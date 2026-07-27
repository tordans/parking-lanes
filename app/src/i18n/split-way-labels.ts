import * as m from '@app/paraglide/messages'
import type { SplitWayDisabledReason } from '../shell/map/use-way-cut'

const splitWayDisabledTooltipByReason = {
  'sign-in': m.split_disabled_sign_in,
  'select-way': m.split_disabled_select_way,
  parent_incomplete: m.split_disabled_parent_incomplete,
  simple_roundabout: m.split_disabled_roundabout,
  'too-few-nodes': m.split_disabled_too_few_nodes,
} as const satisfies Record<Exclude<SplitWayDisabledReason, null>, () => string>

export function getSplitWayDisabledTooltip(reason: SplitWayDisabledReason): string | null {
  if (reason == null) return null
  return splitWayDisabledTooltipByReason[reason]()
}

export function getSplitWayTooltip(isCutActive: boolean): string {
  return isCutActive ? m.split_way_active() : m.split_way_idle()
}
