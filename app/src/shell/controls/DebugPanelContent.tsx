import { ColoredEditorSection } from '../../components/ColoredEditorSection'
import { debugAdminColor } from '../debug'
import { CoverageDebugToggle } from './debug/CoverageDebugToggle'
import { DebugUsersList } from './debug/DebugUsersList'
import { DevOsmDataToggle } from './debug/DevOsmDataToggle'
import { OsmApiServerToggle } from './debug/OsmApiServerToggle'

export function DebugUserSettingsSection() {
  return (
    <ColoredEditorSection
      aria-label="Debug user settings"
      title="Debug user settings"
      color={debugAdminColor}
      className="mb-0"
      contentClassName="flex flex-col gap-4"
    >
      <DebugUsersList />
      <OsmApiServerToggle />
      <DevOsmDataToggle />
      <CoverageDebugToggle />
    </ColoredEditorSection>
  )
}
