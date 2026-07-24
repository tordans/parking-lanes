import { useSearch } from '@tanstack/react-router'
import clsx from 'clsx'
import { Bug, Info, MousePointerClick, Settings } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { LegendContent } from '../../modes/parking/controls/LegendPanel'
import type { ModePanelProps, StreetSpaceMode } from '../../modes/types'
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
import { AppAboutContent } from './AppAboutContent'
import { DatetimeInput } from './Datetime'
import { DebugPanelContent } from './DebugPanelContent'
import { MapMobileSidePanel } from './MapMobileSidePanel'
import { ModeSwitcher } from './ModeSwitcher'
import { SaveButton } from './SaveButton'

type MobilePanel = 'info' | 'inspector' | 'settings' | 'debug' | null

export function MapMobileToolbar(
  props: {
    mode: StreetSpaceMode
    onSave: () => void
  } & ModePanelProps,
) {
  const [openPanel, setOpenPanel] = useState<MobilePanel>(null)
  const { debug } = useSearch({ from: '/' })
  const osmDisplayName = useOsmDisplayName()
  const selectedOsmRef = useSelectedOsmRef()
  const { selectionEpoch } = useFeatureSelection()
  const showDebug = canShowDebugToggle(osmDisplayName, debug)
  const { Panel } = props.mode
  const [inspectorOpenedForEpoch, setInspectorOpenedForEpoch] = useState(0)

  if (selectedOsmRef && selectionEpoch !== inspectorOpenedForEpoch) {
    setInspectorOpenedForEpoch(selectionEpoch)
    if (openPanel !== 'inspector') setOpenPanel('inspector')
  }

  const togglePanel = (panel: Exclude<MobilePanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  const handleInspectorClose = () => {
    props.onClose()
    setOpenPanel(null)
  }

  return (
    <>
      <div className={mobileMapHeaderClassName}>
        <div className="flex min-w-0 items-center gap-2">
          <ModeSwitcher />
          <div className={mapToolbarButtonGroupClassName}>
            <MapToolbarIconButton
              label="Info"
              active={openPanel === 'info'}
              onClick={() => togglePanel('info')}
            >
              <Info className="size-5" aria-hidden />
            </MapToolbarIconButton>
            <MapToolbarIconButton
              label="Inspector"
              active={openPanel === 'inspector'}
              divided
              onClick={() => togglePanel('inspector')}
            >
              <MousePointerClick className="size-5" aria-hidden />
            </MapToolbarIconButton>
            <MapToolbarIconButton
              label="Settings"
              active={openPanel === 'settings'}
              divided
              onClick={() => togglePanel('settings')}
            >
              <Settings className="size-5" aria-hidden />
            </MapToolbarIconButton>
            {showDebug ? (
              <MapToolbarIconButton
                label="Debug"
                active={openPanel === 'debug'}
                divided
                onClick={() => togglePanel('debug')}
              >
                <Bug className="size-5" aria-hidden />
              </MapToolbarIconButton>
            ) : null}
          </div>
        </div>
        <SaveButton onClick={props.onSave} />
      </div>

      <MapMobileSidePanel
        title="Info"
        open={openPanel === 'info'}
        onClose={() => setOpenPanel(null)}
      >
        <div className="flex flex-col gap-4">
          <AppAboutContent variant="panel" />
          <section>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">Legend</h3>
            <LegendContent />
          </section>
        </div>
      </MapMobileSidePanel>

      <MapMobileSidePanel
        title="Inspector"
        open={openPanel === 'inspector'}
        onClose={() => setOpenPanel(null)}
      >
        <Panel
          key={selectedOsmRef ? `${selectedOsmRef.type}/${selectedOsmRef.id}` : 'none'}
          onCutLane={props.onCutLane}
          onOsmChange={props.onOsmChange}
          onClose={handleInspectorClose}
        />
      </MapMobileSidePanel>

      <MapMobileSidePanel
        title="Settings"
        open={openPanel === 'settings'}
        onClose={() => setOpenPanel(null)}
      >
        <DatetimeInput fullWidth />
      </MapMobileSidePanel>

      {showDebug ? (
        <MapMobileSidePanel
          title="Debug"
          open={openPanel === 'debug'}
          onClose={() => setOpenPanel(null)}
        >
          <DebugPanelContent />
        </MapMobileSidePanel>
      ) : null}
    </>
  )
}

function MapToolbarIconButton(props: {
  label: string
  active: boolean
  divided?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      aria-expanded={props.active}
      className={clsx(
        mapToolbarIconSegmentClassName,
        props.divided && mapToolbarButtonDividerClassName,
        props.active && mapToolbarIconSegmentActiveClassName,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  )
}
