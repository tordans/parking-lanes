import * as m from '@app/paraglide/messages'
import { useParams } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { useState } from 'react'
import { getModeLabel } from '../../i18n/mode-content'
import { useSelectedOsmRef } from '../../modes/parking'
import { ParkingDatetimeFilter } from '../../modes/parking/controls/ParkingDatetimeFilter'
import { useActiveStreetSpaceMode } from '../../modes/registry'
import type { StreetSpaceMode, StreetSpaceModeId } from '../../modes/types'
import { useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'
import { AccountCallout } from './AccountCallout'
import { AppAboutContent, AppVersionFooter } from './AppAboutContent'
import { DebugUserSettingsSection } from './DebugPanelContent'
import { LanguageSwitcher } from './LanguageSwitcher'
import { PanelModeSwitcher, panelModesForMode, type MapPanelMode } from './PanelModeSwitcher'
import { PanelSectionDivider } from './PanelSectionDivider'

function initialPanelMode(modeId: string, selected: boolean): MapPanelMode {
  if (modeId === 'lanes') return 'info'
  return selected ? 'inspector' : 'info'
}

export function SettingsPanelContent(props: { showDebug?: boolean }) {
  return (
    <div className="flex flex-col gap-4 p-1">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{m.shell_account_title()}</h3>
        <AccountCallout />
      </section>
      <ParkingDatetimeFilter fullWidth />
      {props.showDebug ? <DebugUserSettingsSection /> : null}
    </div>
  )
}

export function InfoPanelContent(props: {
  modeId: StreetSpaceModeId
  about: StreetSpaceMode['about']
  maturity: StreetSpaceMode['maturity']
  Legend?: ComponentType<{ variant?: 'floating' | 'inline' }>
}) {
  const Legend = props.Legend

  return (
    <div className="flex flex-col p-1">
      <AppAboutContent
        modeId={props.modeId}
        about={props.about}
        modeLabel={getModeLabel(props.modeId)}
        maturity={props.maturity}
      />
      {Legend ? (
        <>
          <PanelSectionDivider />
          <section className="py-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">{m.shell_legend_title()}</h3>
            <Legend variant="inline" />
          </section>
        </>
      ) : null}
      <PanelSectionDivider />
      <AppVersionFooter />
      <PanelSectionDivider />
      <section className="py-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900">{m.shell_language_title()}</h3>
        <LanguageSwitcher />
      </section>
    </div>
  )
}

export function ControlPanel() {
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const mode = useActiveStreetSpaceMode(modeSlug as StreetSpaceModeId)
  const { Panel, Legend } = mode
  const selectedOsmRef = useSelectedOsmRef()
  const osmDisplayName = useOsmDisplayName()
  const showDebug = canShowDebugToggle(osmDisplayName)
  const availablePanelModes = panelModesForMode(mode.id)
  const [panelMode, setPanelMode] = useState<MapPanelMode>(() =>
    initialPanelMode(mode.id, selectedOsmRef != null),
  )
  const activePanelMode = availablePanelModes.includes(panelMode) ? panelMode : 'info'

  return (
    <div className="flex h-full flex-col overflow-hidden text-sm">
      <PanelModeSwitcher
        className="shrink-0"
        mode={activePanelMode}
        modes={availablePanelModes}
        onChange={setPanelMode}
      />
      <div className="min-h-0 flex-1 overflow-auto p-2 [--panel-section-bleed:0.75rem]">
        {activePanelMode === 'info' ? (
          <InfoPanelContent
            modeId={mode.id}
            about={mode.about}
            maturity={mode.maturity}
            Legend={Legend}
          />
        ) : null}
        {activePanelMode === 'inspector' ? <Panel /> : null}
        {activePanelMode === 'settings' ? <SettingsPanelContent showDebug={showDebug} /> : null}
      </div>
    </div>
  )
}
