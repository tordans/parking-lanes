import * as m from '@app/paraglide/messages'
import { MapFeaturePromptEmptyState } from '../../shell/controls/MapFeatureEmptyState'

/** Lanes editing lives in the bottom panel; the inspector tab is not used on desktop. */
export function LanesModePanel() {
  return <MapFeaturePromptEmptyState message={m.empty_click_lanes()} />
}
