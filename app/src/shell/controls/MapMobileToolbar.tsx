import { useSearch } from '@tanstack/react-router'
import clsx from 'clsx'
import { Info, MousePointerClick, Settings } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
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
import { InfoPanelContent, SettingsPanelContent } from './ControlPanel'
import { MobileBottomSheet } from './MobileBottomSheet'
import { ModeSwitcher } from './ModeSwitcher'

type MobilePanel = 'info' | 'inspector' | 'settings' | null

export function MapMobileToolbar(
  props: {
    mode: StreetSpaceMode
    saveControl?: ReactNode
  } & ModePanelProps,
) {
  const isDesktop = useBreakpoint('sm')
  const [openPanel, setOpenPanel] = useState<MobilePanel>(null)
  const { debug } = useSearch({ from: '/$mode' })
  const osmDisplayName = useOsmDisplayName()
  const selectedOsmRef = useSelectedOsmRef()
  const { selectionEpoch } = useFeatureSelection()
  const showDebug = canShowDebugToggle(osmDisplayName, debug)
  const { Panel, Legend } = props.mode
  const [inspectorOpenedForEpoch, setInspectorOpenedForEpoch] = useState(0)

  if (isDesktop) return null

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
          </div>
        </div>
        {props.saveControl}
      </div>

      <MobileBottomSheet
        title="Info"
        open={openPanel === 'info'}
        onClose={() => setOpenPanel(null)}
      >
        <div className="pb-4">
          <InfoPanelContent about={props.mode.about} Legend={Legend} />
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        title="Inspector"
        open={openPanel === 'inspector'}
        onClose={() => setOpenPanel(null)}
      >
        <div className="pb-4">
          <Panel
            key={selectedOsmRef ? `${selectedOsmRef.type}/${selectedOsmRef.id}` : 'none'}
            onOsmChange={props.onOsmChange}
            onClose={handleInspectorClose}
          />
        </div>
      </MobileBottomSheet>

      <MobileBottomSheet
        title="Settings"
        open={openPanel === 'settings'}
        onClose={() => setOpenPanel(null)}
      >
        <div className="pb-4">
          <SettingsPanelContent showDebug={showDebug} />
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
  children: ReactNode
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
