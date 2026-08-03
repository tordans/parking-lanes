import * as m from '@app/paraglide/messages'
import { serializeFeatureParam } from '@osm-editor-kit/osm-map-url'
import { useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { Info, MousePointerClick, Settings } from 'lucide-react'
import { useState } from 'react'
import { getModeLabel } from '../../i18n/mode-content'
import { LanesDiagramPanel } from '../../modes/lanes/LanesDiagramPanel'
import { LanesFormPanel } from '../../modes/lanes/LanesFormPanel'
import { useActiveStreetSpaceMode } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import { useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'
import {
  useFeatureSelectionActions,
  useSelectedOsmRef,
  useSelectionEpoch,
} from '../map/feature-selection-store'
import {
  mapToolbarButtonDividerClassName,
  mapToolbarButtonGroupClassName,
  mapToolbarIconSegmentActiveClassName,
  mapToolbarIconSegmentClassName,
  mobileMapHeaderClassName,
} from '../map/mobileMapChrome.const'
import { InfoPanelContent, SettingsPanelContent } from './ControlPanel'
import { MobileBottomSheet } from './MobileBottomSheet'
import { ModeSwitcher } from './ModeSwitcher'
import { panelModesForMode } from './PanelModeSwitcher'
import { SaveChangesControl } from './SaveChangesControl'

type MobilePanel = 'info' | 'inspector' | 'settings' | 'mode-editor' | null

export function MapMobileToolbar() {
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const mode = useActiveStreetSpaceMode(modeSlug as StreetSpaceModeId)
  const [openPanel, setOpenPanel] = useState<MobilePanel>(null)
  const osmDisplayName = useOsmDisplayName()
  const selectedOsmRef = useSelectedOsmRef()
  const selectionEpoch = useSelectionEpoch()
  const { clearSelection } = useFeatureSelectionActions()
  const showDebug = canShowDebugToggle(osmDisplayName)
  const { Panel, Legend } = mode
  const isLanesMode = mode.id === 'lanes'
  const hasWaySelection = selectedOsmRef?.type === 'way'
  const showLanesEditor = isLanesMode && hasWaySelection
  const toolbarPanelModes = panelModesForMode(mode.id)
  const [inspectorOpenedForEpoch, setInspectorOpenedForEpoch] = useState(0)
  const [modeEditorOpenedForEpoch, setModeEditorOpenedForEpoch] = useState(0)

  if (!showLanesEditor && selectedOsmRef && selectionEpoch !== inspectorOpenedForEpoch) {
    setInspectorOpenedForEpoch(selectionEpoch)
    if (openPanel !== 'inspector') setOpenPanel('inspector')
  }

  if (showLanesEditor && selectionEpoch !== modeEditorOpenedForEpoch) {
    setModeEditorOpenedForEpoch(selectionEpoch)
    if (openPanel !== 'mode-editor') setOpenPanel('mode-editor')
  }

  const togglePanel = (panel: Exclude<MobilePanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  const handleInspectorClose = () => {
    clearSelection()
    setOpenPanel(null)
  }

  const handleModeEditorClose = () => {
    clearSelection()
    setOpenPanel(null)
  }

  return (
    <>
      <div className={mobileMapHeaderClassName}>
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          <ModeSwitcher />
          {showLanesEditor ? null : (
            <div className={mapToolbarButtonGroupClassName}>
              {toolbarPanelModes.includes('info') ? (
                <MapToolbarIconButton
                  label={m.shell_panel_info()}
                  active={openPanel === 'info'}
                  onClick={() => togglePanel('info')}
                >
                  <Info className="size-5" aria-hidden />
                </MapToolbarIconButton>
              ) : null}
              {toolbarPanelModes.includes('inspector') ? (
                <MapToolbarIconButton
                  label={m.shell_panel_inspector()}
                  active={openPanel === 'inspector'}
                  divided={toolbarPanelModes.includes('info')}
                  onClick={() => togglePanel('inspector')}
                >
                  <MousePointerClick className="size-5" aria-hidden />
                </MapToolbarIconButton>
              ) : null}
              {toolbarPanelModes.includes('settings') ? (
                <MapToolbarIconButton
                  label={m.shell_panel_settings()}
                  active={openPanel === 'settings'}
                  divided={
                    toolbarPanelModes.includes('info') || toolbarPanelModes.includes('inspector')
                  }
                  onClick={() => togglePanel('settings')}
                >
                  <Settings className="size-5" aria-hidden />
                </MapToolbarIconButton>
              ) : null}
            </div>
          )}
        </div>
        <div className="pointer-events-auto">
          <SaveChangesControl />
        </div>
      </div>

      <MobileBottomSheet
        title={m.shell_panel_info()}
        open={!showLanesEditor && openPanel === 'info'}
        onClose={() => setOpenPanel(null)}
      >
        <div className="pb-4">
          <InfoPanelContent
            modeId={mode.id}
            about={mode.about}
            maturity={mode.maturity}
            Legend={Legend}
            InfoExtras={mode.InfoExtras}
          />
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        title={m.shell_panel_inspector()}
        open={!showLanesEditor && openPanel === 'inspector'}
        onClose={handleInspectorClose}
      >
        <div className="pb-4" key={selectedOsmRef ? serializeFeatureParam(selectedOsmRef) : 'none'}>
          <Panel />
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        title={m.shell_panel_settings()}
        open={!showLanesEditor && openPanel === 'settings'}
        onClose={() => setOpenPanel(null)}
      >
        <div className="pb-4">
          <SettingsPanelContent showDebug={showDebug} />
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        title={getModeLabel(mode.id)}
        open={showLanesEditor && openPanel === 'mode-editor'}
        onClose={handleModeEditorClose}
        mapPeek="10%"
      >
        <div
          className="flex flex-col gap-3 pb-4"
          key={selectedOsmRef ? serializeFeatureParam(selectedOsmRef) : 'none'}
        >
          <div className="max-h-48 overflow-hidden rounded-md border border-zinc-200 bg-white">
            <LanesDiagramPanel />
          </div>
          <LanesFormPanel />
        </div>
      </MobileBottomSheet>
    </>
  )
}

function MapToolbarIconButton(props: {
  label: string
  active: boolean
  divided?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      aria-expanded={props.active}
      className={clsx(
        props.active ? mapToolbarIconSegmentActiveClassName : mapToolbarIconSegmentClassName,
        props.divided && mapToolbarButtonDividerClassName,
      )}
      onClick={() => {
        if (props.active) return
        props.onClick()
      }}
    >
      {props.children}
    </button>
  )
}
