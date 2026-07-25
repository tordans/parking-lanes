import {
  debugUserSettingsHeaderClassName,
  debugUserSettingsHeaderStyle,
  debugUserSettingsSectionClassName,
  debugUserSettingsSectionStyle,
} from '../debug'
import { CoverageDebugToggle } from './debug/CoverageDebugToggle'
import { DebugUsersList } from './debug/DebugUsersList'
import { DevOsmDataToggle } from './debug/DevOsmDataToggle'
import { OsmApiServerToggle } from './debug/OsmApiServerToggle'

export function DebugUserSettingsSection() {
  return (
    <section
      aria-label="Debug user settings"
      className={debugUserSettingsSectionClassName()}
      style={debugUserSettingsSectionStyle()}
    >
      <div className={debugUserSettingsHeaderClassName()} style={debugUserSettingsHeaderStyle()}>
        Debug user settings
      </div>
      <div className="flex flex-col gap-4 px-2 py-1.5">
        <DebugUsersList />
        <OsmApiServerToggle />
        <DevOsmDataToggle />
        <CoverageDebugToggle />
      </div>
    </section>
  )
}
