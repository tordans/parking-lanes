import { serializeMapParam, setLocationToCookie } from '@osm-editor-kit/osm-map-url'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  AttributionControl,
  type MapLayerMouseEvent,
  type MapEvent,
  type MapMouseEvent,
  type ViewStateChangeEvent,
  useMap,
} from 'react-map-gl/maplibre'
import { AppShell } from '../../components/AppShell'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useVisibleViewportHeightVar } from '../../hooks/useVisibleViewportHeightVar'
import { APP_NAME, APP_VERSION } from '../../lib/app-identity'
import { exposeMainMapForDebugging, firePlaywrightMapLoadedEvent } from '../../lib/map-debug'
import { OsmApiRequestError, uploadChanges } from '../../lib/osm-client'
import { toast } from '../../lib/toast'
import { getMapSizePx, toBounds, useParkingCoveragePace, viewMinZoom } from '../../modes/parking'
import {
  useParkingLayerClickHandler,
  useParkingMapClickHandler,
  useParkingOsmChangeHandler,
} from '../../modes/parking/use-parking-mode-handlers'
import { useActiveStreetSpaceMode } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import { useWidthCoveragePace, viewMinZoom as widthViewMinZoom } from '../../modes/width'
import { useWidthMapActions } from '../../modes/width/map/width-map-store'
import {
  useWidthModeHandlers,
  useWidthOsmChangeHandler,
} from '../../modes/width/use-width-mode-handlers'
import { changesStore, clearChanges, removeChangedEntity } from '../../utils/changes-store'
import {
  OPENFREEMAP_POSITRON_STYLE_URL,
  openFreeMapTransformStyle,
} from '../../utils/openfreemap-style'
import { useActiveMode, useAppActions, useMapBounds } from '../app-store'
import { ControlPanel } from '../controls/ControlPanel'
import { MapMobileToolbar } from '../controls/MapMobileToolbar'
import { ModeSwitcher } from '../controls/ModeSwitcher'
import { SaveChangesControl } from '../controls/SaveChangesControl'
import { coverageDebugFetchFillLayerId, CoverageDebugLayers } from './CoverageDebugLayers'
import {
  FeatureSelectionProvider,
  useFeatureSelection,
  useSelectedOsmRef,
} from './feature-selection'
import { MapGL, MapProvider } from './map-gl'
import { MAIN_MAP_ID } from './map-ids'
import { useMapActions } from './map-store'
import { useMapViewport } from './map-viewport'
import { MapNavigationControls } from './MapNavigationControls'
import { MapResizeHandler } from './MapResizeHandler'
import {
  remapOsmWayIdInSession,
  removeOsmWayFromSession,
  restoreOsmWayInSession,
} from './osm-session-way-edits'
import { serializeMapSearch } from './search-schema'
import { useSelectionBacklights } from './use-selection-backlights'
import { WAY_CUT_MARKERS_HITAREA_LAYER_ID, useWayCutHandler } from './use-way-cut'
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
  const navigate = useNavigate({ from: '/$mode' })
  const { debug, map: mapSearch } = useSearch({ from: '/$mode' })
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const { zoom: mapZoom } = useMapViewport()
  const queryClient = useQueryClient()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const styleTransformApplied = useRef(false)
  const maps = useMap()
  const mainMap = maps[MAIN_MAP_ID]

  const { setMapBounds, setChangesCount, setActiveMode } = useAppActions()
  const { markMapLoaded, resetMapChrome, setMapTilesLoading } = useMapActions()
  const mapBounds = useMapBounds()
  const activeModeId = useActiveMode()
  const resolvedModeId = modeSlug as StreetSpaceModeId
  const mode = useActiveStreetSpaceMode(resolvedModeId)
  const isWidthMode = resolvedModeId === 'width'
  const selectedOsmRef = useSelectedOsmRef()
  const { updateFeatureRef, clearSelection, selectionEpoch } = useFeatureSelection()
  const { clearDraft: clearWidthDraft } = useWidthMapActions()
  const { clearCutMarkers } = useWayCutActions()
  const { handleCutMarkerClick } = useWayCutHandler()
  const prevModeRef = useRef(resolvedModeId)

  const [cursorStyle, setCursorStyle] = useState('grab')
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [coverageHoverInfo, setCoverageHoverInfo] = useState<{
    fetchedAt: string
    kind: string
    requestIndex: number
    requestCount: number
    groupId: string
  } | null>(null)

  const parkingCoverage = useParkingCoveragePace(!isWidthMode)
  const widthCoverage = useWidthCoveragePace(isWidthMode)
  const { scheduleCoverageCheck, loadCoverageNow, refetchAfterSave } = isWidthMode
    ? widthCoverage
    : parkingCoverage
  const isDesktop = useBreakpoint('sm')

  useEffect(
    function syncActiveModeFromSlug() {
      if (resolvedModeId !== activeModeId) {
        setActiveMode(resolvedModeId)
      }
    },
    [activeModeId, resolvedModeId, setActiveMode],
  )

  useEffect(
    function clearSelectionOnModeSwitch() {
      if (prevModeRef.current === resolvedModeId) return
      clearSelection()
      clearWidthDraft()
      clearCutMarkers()
      prevModeRef.current = resolvedModeId
    },
    [clearCutMarkers, clearSelection, clearWidthDraft, resolvedModeId],
  )

  useEffect(
    function clearCutMarkersOnSelectionChange() {
      clearCutMarkers()
    },
    [clearCutMarkers, selectedOsmRef?.id, selectedOsmRef?.type],
  )

  useEffect(
    function resetMapChromeOnUnmount() {
      return resetMapChrome
    },
    [resetMapChrome],
  )

  const handleParkingOsmChange = useParkingOsmChangeHandler()
  const handleWidthOsmChange = useWidthOsmChangeHandler()
  const handleOsmChange = isWidthMode ? handleWidthOsmChange : handleParkingOsmChange

  const parkingLayerClick = useParkingLayerClickHandler()
  const parkingMapClick = useParkingMapClickHandler()
  const widthHandlers = useWidthModeHandlers()

  const handleLayerClick = (event: MapLayerMouseEvent) => {
    const layerId = event.features?.[0]?.layer?.id
    if (layerId === WAY_CUT_MARKERS_HITAREA_LAYER_ID) {
      handleCutMarkerClick(event)
      return
    }
    if (isWidthMode) {
      widthHandlers.handleLayerClick(event)
      return
    }
    parkingLayerClick(event)
  }
  const handleMapClick = isWidthMode ? widthHandlers.handleMapClick : parkingMapClick
  const ModeMapLayers = mode.MapLayers
  const minZoom = isWidthMode ? widthViewMinZoom : viewMinZoom

  const interactiveLayerIds = [
    ...mode.interactiveLayerIds,
    WAY_CUT_MARKERS_HITAREA_LAYER_ID,
    ...(debug ? [coverageDebugFetchFillLayerId] : []),
  ]

  useVisibleViewportHeightVar(true)
  useSelectionBacklights()

  function writeMapViewport(
    viewState: ViewStateChangeEvent['viewState'],
    bounds: ReturnType<typeof toBounds>,
  ) {
    const { zoom, latitude, longitude, bearing } = viewState
    setMapBounds(bounds)
    setLocationToCookie({ lat: latitude, lng: longitude }, zoom)

    void navigate({
      search: (prev) => ({
        ...serializeMapSearch(prev),
        map: serializeMapParam({ zoom, lat: latitude, lng: longitude, bearing }),
      }),
      replace: true,
    })
  }

  function onMove(event: ViewStateChangeEvent) {
    scheduleCoverageCheck(event.target)
  }

  function onMoveEnd(event: ViewStateChangeEvent) {
    const map = event.target
    writeMapViewport(event.viewState, toBounds(map.getBounds()))
    scheduleCoverageCheck(map)
  }

  function onMapData() {
    setMapTilesLoading(true)
  }

  function onMapIdle() {
    setMapTilesLoading(false)
  }

  function onMapLoad(event: MapEvent) {
    const map = event.target

    if (!styleTransformApplied.current) {
      styleTransformApplied.current = true
      map.setStyle(OPENFREEMAP_POSITRON_STYLE_URL, {
        transformStyle: openFreeMapTransformStyle,
      })
    }

    markMapLoaded()
    exposeMainMapForDebugging(map)
    firePlaywrightMapLoadedEvent()

    const zoom = map.getZoom()
    const center = map.getCenter()
    const bearing = map.getBearing()
    const bounds = toBounds(map.getBounds())
    setMapBounds(bounds)

    if (!mapSearch) {
      void navigate({
        search: (prev) => ({
          ...serializeMapSearch(prev),
          map: serializeMapParam({
            zoom,
            lat: center.lat,
            lng: center.lng,
            bearing: bearing || undefined,
          }),
        }),
        replace: true,
      })
    }

    if (zoom >= minZoom) {
      void loadCoverageNow(bounds, zoom, { mapSizePx: getMapSizePx(map) })
    }
  }

  function handleMouseMove(event: MapLayerMouseEvent) {
    if (isWidthMode) {
      widthHandlers.handleMouseMove(event)
    }

    setCursorStyle(event.features?.length ? 'pointer' : 'grab')

    if (!debug) {
      setHoveredGroupId(null)
      setCoverageHoverInfo(null)
      return
    }

    const debugFeature = event.features?.find(
      (feature) => feature.layer?.id === coverageDebugFetchFillLayerId,
    )
    const props = debugFeature?.properties as
      | {
          groupId?: string
          fetchedAt?: string
          kind?: string
          requestIndex?: number
          requestCount?: number
        }
      | undefined

    if (!props?.groupId) {
      setHoveredGroupId(null)
      setCoverageHoverInfo(null)
      return
    }

    setHoveredGroupId(props.groupId)
    setCoverageHoverInfo({
      groupId: props.groupId,
      fetchedAt: props.fetchedAt ?? '',
      kind: props.kind ?? '',
      requestIndex: props.requestIndex ?? 0,
      requestCount: props.requestCount ?? 0,
    })
  }

  function handleMouseLeave() {
    if (isWidthMode) {
      widthHandlers.handleMouseUp()
    }
    setCursorStyle('grab')
    setHoveredGroupId(null)
    setCoverageHoverInfo(null)
  }

  function handleMouseDown(event: MapLayerMouseEvent) {
    if (!isWidthMode) return
    widthHandlers.handleMouseDown(event)
  }

  function handleMouseUp(_event: MapMouseEvent) {
    if (!isWidthMode) return
    widthHandlers.handleMouseUp()
  }

  function handleClick(event: MapLayerMouseEvent) {
    if (event.features?.length) {
      handleLayerClick(event)
      return
    }
    handleMapClick()
  }

  async function handleSave(comment: string) {
    try {
      const changedIdMap = await uploadChanges(APP_NAME, APP_VERSION, changesStore, { comment })
      for (const oldId in changedIdMap) {
        const newId = changedIdMap[oldId]!
        const remappedWay = remapOsmWayIdInSession(queryClient, Number(oldId), Number(newId))

        if (selectedOsmRef?.type === 'way' && selectedOsmRef.id === Number(oldId) && remappedWay) {
          updateFeatureRef({ type: 'way', id: remappedWay.id })
        }
      }
      clearChanges()
      setChangesCount(0)

      if (mapBounds && mapZoom >= minZoom) {
        const maplibreMap = mainMap?.getMap()
        const sizePx = maplibreMap ? getMapSizePx(maplibreMap) : undefined
        await refetchAfterSave(mapBounds, mapZoom, sizePx)
      }
    } catch (err) {
      if (err instanceof OsmApiRequestError) toast.error(err.responseText || err.message)
      else toast.fromError(err, 'Could not save changes')
      throw err
    }
  }

  function handleDiscardWay(wayId: number, result: ReturnType<typeof removeChangedEntity>) {
    if (result.wasCreate) {
      removeOsmWayFromSession(queryClient, wayId)
      return
    }
    if (result.original) {
      restoreOsmWayInSession(queryClient, result.original)
    }
  }

  return (
    <AppShell
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
                onLoad={onMapLoad}
                onData={onMapData}
                onIdle={onMapIdle}
                onMove={onMove}
                onMoveEnd={onMoveEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                <MapResizeHandler containerRef={mapContainerRef} />
                <AttributionControl compact position="bottom-left" />
                {debug ? <CoverageDebugLayers hoveredGroupId={hoveredGroupId} /> : null}
                <ModeMapLayers />
                <WayCutLayers />
              </MapGL>
              <ViewMinZoomOverlay />
            </div>
          </div>

          <MapMobileToolbar
            mode={mode}
            onOsmChange={handleOsmChange}
            onClose={clearSelection}
            saveControl={<SaveChangesControl onSave={handleSave} onDiscardWay={handleDiscardWay} />}
          />

          {isDesktop ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2.5 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
              <ModeSwitcher />
              <SaveChangesControl onSave={handleSave} onDiscardWay={handleDiscardWay} />
            </div>
          ) : null}

          <MapNavigationControls />

          <div className="pointer-events-auto absolute top-[calc(env(safe-area-inset-top)+3.5rem)] left-2.5 z-10 flex flex-col gap-2 sm:top-2.5">
            {debug && coverageHoverInfo ? (
              <div className="max-w-xs rounded-lg bg-white/90 px-2 py-1.5 text-xs shadow-xs ring-1 ring-zinc-950/5 backdrop-blur-sm">
                <div className="font-medium text-zinc-900">Coverage fetch</div>
                <div className="mt-1 space-y-0.5 text-zinc-700">
                  <div>Fetched: {coverageHoverInfo.fetchedAt}</div>
                  <div>Kind: {coverageHoverInfo.kind}</div>
                  <div>
                    Request: {coverageHoverInfo.requestIndex + 1}/{coverageHoverInfo.requestCount}
                  </div>
                  <div className="truncate text-zinc-500">Group: {coverageHoverInfo.groupId}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      }
      panel={
        <ControlPanel
          key={
            selectedOsmRef
              ? `${selectedOsmRef.type}/${selectedOsmRef.id}:${selectionEpoch}`
              : 'none'
          }
          mode={mode}
          onOsmChange={handleOsmChange}
          onClose={clearSelection}
        />
      }
    />
  )
}
