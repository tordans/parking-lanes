import * as m from '@app/paraglide/messages'
import { serializeFeatureParam } from '@osm-editor-kit/osm-map-url'
import { OPENFREEMAP_POSITRON_STYLE_URL } from '@osm-editor-kit/osm-maplibre'
import { useParams } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { AttributionControl } from 'react-map-gl/maplibre'
import { AppShell } from '../../components/AppShell'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useVisibleViewportHeightVar } from '../../hooks/useVisibleViewportHeightVar'
import { useUiLocale } from '../../i18n/useUiLocale'
import { useLanesMapActions } from '../../modes/lanes/map/lanes-map-store'
import { useActiveStreetSpaceMode } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import { useWidthMapActions } from '../../modes/width/map/width-map-store'
import { ControlPanel } from '../controls/ControlPanel'
import { MapMobileToolbar } from '../controls/MapMobileToolbar'
import { ModeSwitcher } from '../controls/ModeSwitcher'
import { SaveChangesControl } from '../controls/SaveChangesControl'
import { useModeHotkeys } from '../controls/use-mode-hotkeys'
import { AtlasBoundariesSource } from './AtlasBoundariesSource'
import { CoverageDebugMapLayers, CoverageDebugTooltip } from './CoverageDebugOverlay'
import {
  FeatureSelectionProvider,
  useFeatureSelection,
  useSelectedOsmRef,
} from './feature-selection'
import { MapGL, MapProvider } from './map-gl'
import { MAIN_MAP_ID } from './map-ids'
import { useMapActions } from './map-store'
import { MapBackgroundLayerSource } from './MapBackgroundLayerSource'
import { MapNavigationControls } from './MapNavigationControls'
import { MapResizeHandler } from './MapResizeHandler'
import { useMapCoverageLifecycle } from './use-map-coverage-lifecycle'
import { useMapPageInteractions } from './use-map-page-interactions'
import { useSelectionBacklights } from './use-selection-backlights'
import { useSyncBackgroundImageryContext } from './use-sync-background-imagery'
import { ViewMinZoomOverlay } from './ViewMinZoomOverlay'
import { useWayCutActions } from './way-cut-store'
import { WayCutLayers } from './WayCutLayers'

export function MapPage({
  initialView,
}: {
  initialView: { longitude: number; latitude: number; zoom: number; bearing?: number }
}) {
  return (
    <FeatureSelectionProvider>
      <MapProvider>
        <MapPageContent initialView={initialView} />
      </MapProvider>
    </FeatureSelectionProvider>
  )
}

function MapPageContent({
  initialView,
}: {
  initialView: { longitude: number; latitude: number; zoom: number; bearing?: number }
}) {
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const resolvedModeId = modeSlug as StreetSpaceModeId
  const mode = useActiveStreetSpaceMode(resolvedModeId)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const selectedOsmRef = useSelectedOsmRef()
  const { selectionEpoch } = useFeatureSelection()
  const { clearDraft: clearWidthDraft } = useWidthMapActions()
  const { clearLanesState } = useLanesMapActions()
  const { cancelCut } = useWayCutActions()
  const { resetMapChrome } = useMapActions()
  const prevModeRef = useRef(resolvedModeId)
  const isDesktop = useBreakpoint('sm')
  const uiLocale = useUiLocale()

  useEffect(() => {
    document.documentElement.lang = uiLocale
    document.title = m.app_title()
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', m.app_description())
  }, [uiLocale])

  const coverageLifecycle = useMapCoverageLifecycle()
  const {
    cursorStyle,
    interactiveLayerIds,
    coverageDebug,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
  } = useMapPageInteractions()

  const ModeMapLayers = mode.MapLayers
  const BottomPanel = mode.BottomPanel
  const isLanesMode = resolvedModeId === 'lanes'
  const hasWaySelection = selectedOsmRef?.type === 'way'
  const showLanesBottomEditor = isLanesMode && hasWaySelection && BottomPanel != null
  const showSidebar = !showLanesBottomEditor

  useEffect(
    function resetModeLocalStateOnModeSwitch() {
      if (prevModeRef.current === resolvedModeId) return
      clearWidthDraft()
      clearLanesState()
      cancelCut()
      prevModeRef.current = resolvedModeId
    },
    [cancelCut, clearLanesState, clearWidthDraft, resolvedModeId],
  )

  useEffect(
    function clearCutOnSelectionChange() {
      cancelCut()
    },
    [cancelCut, selectedOsmRef?.id, selectedOsmRef?.type],
  )

  useEffect(
    function resetMapChromeOnUnmount() {
      return resetMapChrome
    },
    [resetMapChrome],
  )

  useVisibleViewportHeightVar(true)
  useSelectionBacklights()
  useSyncBackgroundImageryContext()
  useModeHotkeys()

  return (
    <AppShell
      key={uiLocale}
      map={
        <div ref={mapContainerRef} className="relative h-full w-full">
          <div className="fixed inset-0 z-0 sm:static sm:inset-auto sm:z-auto sm:h-full sm:w-full">
            <div className="relative h-full w-full">
              <MapGL
                id={MAIN_MAP_ID}
                reuseMaps
                mapStyle={OPENFREEMAP_POSITRON_STYLE_URL}
                initialViewState={{
                  longitude: initialView.longitude,
                  latitude: initialView.latitude,
                  zoom: initialView.zoom,
                  bearing: initialView.bearing ?? 0,
                }}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                maxPitch={0}
                touchPitch={false}
                pitchWithRotate={false}
                cursor={cursorStyle}
                interactiveLayerIds={interactiveLayerIds}
                onLoad={coverageLifecycle.onMapLoad}
                onData={coverageLifecycle.onMapData}
                onIdle={coverageLifecycle.onMapIdle}
                onMove={coverageLifecycle.onMove}
                onMoveEnd={coverageLifecycle.onMoveEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                <MapResizeHandler containerRef={mapContainerRef} />
                <AttributionControl compact position="bottom-left" />
                {/* Above default style, below mode/debug layers (react-map-gl child order). */}
                <MapBackgroundLayerSource />
                <AtlasBoundariesSource />
                <CoverageDebugMapLayers hoveredGroupId={coverageDebug.hoveredGroupId} />
                <ModeMapLayers />
                <WayCutLayers />
              </MapGL>
              <ViewMinZoomOverlay />
            </div>
          </div>

          {isDesktop ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2.5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
              <ModeSwitcher />
              <SaveChangesControl />
            </div>
          ) : (
            <MapMobileToolbar />
          )}

          <MapNavigationControls />

          <div className="pointer-events-auto absolute top-[calc(env(safe-area-inset-top)+3.5rem)] left-2.5 z-10 flex flex-col gap-2 sm:top-2.5">
            <CoverageDebugTooltip info={coverageDebug.coverageHoverInfo} />
          </div>
        </div>
      }
      bottom={showLanesBottomEditor && BottomPanel ? <BottomPanel /> : undefined}
      panel={
        showSidebar ? (
          <ControlPanel
            key={
              selectedOsmRef ? `${serializeFeatureParam(selectedOsmRef)}:${selectionEpoch}` : 'none'
            }
          />
        ) : undefined
      }
    />
  )
}
