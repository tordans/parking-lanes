import * as m from '@app/paraglide/messages'
import { serializeFeatureParam } from '@osm-editor-kit/osm-map-url'
import { useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { Info, MousePointerClick, Settings } from 'lucide-react'
import { useState } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { getModeLabel } from '../../i18n/mode-content'
import { LanesBottomPanel } from '../../modes/lanes/LanesBottomPanel'
import { useActiveStreetSpaceMode } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import { useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'
import { useFeatureSelection, useSelectedOsmRef } from '../map/feature-selection'
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

type MobilePanel = 'info' | 'inspector' | 'settings' | 'lanes-editor' | null

export function MapMobileToolbar() {
  const isDesktop = useBreakpoint('sm')
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const mode = useActiveStreetSpaceMode(modeSlug as StreetSpaceModeId)
  const [openPanel, setOpenPanel] = useState<MobilePanel>(null)
  const osmDisplayName = useOsmDisplayName()
  const selectedOsmRef = useSelectedOsmRef()
  const { selectionEpoch, clearSelection } = useFeatureSelection()
  const showDebug = canShowDebugToggle(osmDisplayName)
  const { Panel, Legend } = mode
  const isLanesMode = mode.id === 'lanes'
  const hasWaySelection = selectedOsmRef?.type === 'way'
  const showLanesEditor = isLanesMode && hasWaySelection
  const toolbarPanelModes = panelModesForMode(mode.id)
  const [inspectorOpenedForEpoch, setInspectorOpenedForEpoch] = useState(0)
  const [lanesEditorOpenedForEpoch, setLanesEditorOpenedForEpoch] = useState(0)

  if (isDesktop) return null

  if (!isLanesMode && selectedOsmRef && selectionEpoch !== inspectorOpenedForEpoch) {
    setInspectorOpenedForEpoch(selectionEpoch)
    if (openPanel !== 'inspector') setOpenPanel('inspector')
  }

  if (showLanesEditor && selectionEpoch !== lanesEditorOpenedForEpoch) {
    setLanesEditorOpenedForEpoch(selectionEpoch)
    if (openPanel !== 'lanes-editor') setOpenPanel('lanes-editor')
  }

  const togglePanel = (panel: Exclude<MobilePanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  const handleInspectorClose = () => {
    clearSelection()
    setOpenPanel(null)
  }

  const handleLanesEditorClose = () => {
    clearSelection()
    setOpenPanel(null)
  }

  return (
    <>
      <div className={mobileMapHeaderClassName}>
        <div className="flex min-w-0 items-center gap-2">
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
        <SaveChangesControl />
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
        title={getModeLabel('lanes')}
        open={showLanesEditor && openPanel === 'lanes-editor'}
        onClose={handleLanesEditorClose}
        mapPeek="10%"
      >
        <div className="pb-4" key={selectedOsmRef ? serializeFeatureParam(selectedOsmRef) : 'none'}>
          <LanesBottomPanel />
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
