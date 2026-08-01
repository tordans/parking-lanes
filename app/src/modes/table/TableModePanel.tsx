import * as m from '@app/paraglide/messages'
import { MapFeaturePromptEmptyState } from '../../shell/controls/MapFeatureEmptyState'

/** Table editing lives in the bottom panel; the inspector tab is not used on desktop. */
export function TableModePanel() {
  return <MapFeaturePromptEmptyState message={m.empty_click_table()} />
}
