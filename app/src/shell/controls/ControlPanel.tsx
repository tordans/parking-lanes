import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { ComponentType } from 'react'
import { useState } from 'react'
import { useSelectedOsmRef } from '../../modes/parking'
import { ParkingDatetimeFilter } from '../../modes/parking/controls/ParkingDatetimeFilter'
import type { StreetSpaceMode } from '../../modes/types'
import { useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'
import { AccountCallout } from './AccountCallout'
import { AppAboutContent } from './AppAboutContent'
import { DebugUserSettingsSection } from './DebugPanelContent'
import { PanelModeSwitcher, type MapPanelMode } from './PanelModeSwitcher'
import { PanelSectionDivider } from './PanelSectionDivider'

function initialPanelMode(selected: boolean): MapPanelMode {
  return selected ? 'inspector' : 'info'
}

export function SettingsPanelContent(props: { showDebug?: boolean }) {
  return (
    <div className="flex flex-col gap-4 p-1">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">Account</h3>
        <AccountCallout />
      </section>
      <ParkingDatetimeFilter fullWidth />
      {props.showDebug ? <DebugUserSettingsSection /> : null}
    </div>
  )
}

export function InfoPanelContent(props: {
  about: StreetSpaceMode['about']
  Legend?: ComponentType<{ variant?: 'floating' | 'inline' }>
}) {
  const Legend = props.Legend

  return (
    <div className="flex flex-col p-1">
      <AppAboutContent about={props.about} />
      {Legend ? (
        <>
          <PanelSectionDivider />
          <section className="pt-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Legend</h3>
            <Legend variant="inline" />
          </section>
        </>
      ) : null}
    </div>
  )
}

export function ControlPanel(props: {
  mode: StreetSpaceMode
  onOsmChange: (way: OsmWay) => void
  onClose: () => void
}) {
  const { Panel, Legend } = props.mode
  const selectedOsmRef = useSelectedOsmRef()
  const osmDisplayName = useOsmDisplayName()
  const showDebug = canShowDebugToggle(osmDisplayName)
  const [panelMode, setPanelMode] = useState<MapPanelMode>(() =>
    initialPanelMode(selectedOsmRef != null),
  )
  const activePanelMode = panelMode

  return (
    <div className="flex h-full flex-col overflow-hidden text-sm">
      <PanelModeSwitcher className="shrink-0" mode={activePanelMode} onChange={setPanelMode} />
      <div className="min-h-0 flex-1 overflow-auto p-2 [--panel-section-bleed:0.75rem]">
        {activePanelMode === 'info' ? (
          <InfoPanelContent about={props.mode.about} Legend={Legend} />
        ) : null}
        {activePanelMode === 'inspector' ? (
          <Panel onOsmChange={props.onOsmChange} onClose={props.onClose} />
        ) : null}
        {activePanelMode === 'settings' ? <SettingsPanelContent showDebug={showDebug} /> : null}
      </div>
    </div>
  )
}
