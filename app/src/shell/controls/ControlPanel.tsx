import type { OsmWay } from '@osm-editor-kit/osm-data'
import { useSearch } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { useState } from 'react'
import { useSelectedOsmRef } from '../../modes/parking'
import type { StreetSpaceMode } from '../../modes/types'
import { useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'
import { AppAboutContent } from './AppAboutContent'
import { DatetimeInput } from './Datetime'
import { DebugPanelContent } from './DebugPanelContent'
import { PanelModeSwitcher, type MapPanelMode } from './PanelModeSwitcher'
import { SaveButton } from './SaveButton'

function initialPanelMode(selected: boolean): MapPanelMode {
  return selected ? 'inspector' : 'info'
}

export function SettingsPanelContent(props: { onSave: () => void }) {
  return (
    <div className="flex flex-col gap-4 p-1">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">Data</h3>
        <DatetimeInput fullWidth />
        <SaveButton onClick={props.onSave} />
      </section>
    </div>
  )
}

export function InfoPanelContent(props: {
  Legend?: ComponentType<{ variant?: 'floating' | 'inline' }>
}) {
  const Legend = props.Legend

  return (
    <div className="flex flex-col gap-4 p-1">
      <AppAboutContent variant="panel" />
      {Legend ? (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">Legend</h3>
          <Legend variant="inline" />
        </section>
      ) : null}
    </div>
  )
}

export function ControlPanel(props: {
  mode: StreetSpaceMode
  onSave: () => void
  onCutLane: (way: OsmWay) => void
  onOsmChange: (way: OsmWay) => void
  onClose: () => void
}) {
  const { Panel, Legend } = props.mode
  const selectedOsmRef = useSelectedOsmRef()
  const { debug } = useSearch({ from: '/' })
  const osmDisplayName = useOsmDisplayName()
  const showDebug = canShowDebugToggle(osmDisplayName, debug)
  const [panelMode, setPanelMode] = useState<MapPanelMode>(() =>
    initialPanelMode(selectedOsmRef != null),
  )
  const activePanelMode = panelMode === 'debug' && !showDebug ? 'info' : panelMode

  return (
    <div className="flex h-full flex-col overflow-hidden text-sm">
      <div className="shrink-0 border-b border-zinc-950/10 p-2">
        <PanelModeSwitcher mode={activePanelMode} onChange={setPanelMode} showDebug={showDebug} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {activePanelMode === 'info' ? <InfoPanelContent Legend={Legend} /> : null}
        {activePanelMode === 'inspector' ? (
          <Panel
            onCutLane={props.onCutLane}
            onOsmChange={props.onOsmChange}
            onClose={props.onClose}
          />
        ) : null}
        {activePanelMode === 'settings' ? <SettingsPanelContent onSave={props.onSave} /> : null}
        {activePanelMode === 'debug' && showDebug ? <DebugPanelContent /> : null}
      </div>
    </div>
  )
}
