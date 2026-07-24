import { serializeMapParam, setLocationToCookie } from '@osm-editor-kit/osm-map-url'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  AttributionControl,
  type MapLayerMouseEvent,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import { AppShell } from '../../components/AppShell'
import { useVisibleViewportHeightVar } from '../../hooks/useVisibleViewportHeightVar'
import { exposeMainMapForDebugging, firePlaywrightMapLoadedEvent } from '../../lib/map-debug'
import { OsmApiRequestError, uploadChanges } from '../../lib/osm-client'
import {
  getMapSizePx,
  remapParkingOsmWayId,
  toBounds,
  useParkingCoveragePace,
  viewMinZoom,
} from '../../modes/parking'
import { useDevOsmFixtureSeed } from '../../modes/parking/map/dev-osm-fixture'
import {
  useParkingCutLaneHandler,
  useParkingLayerClickHandler,
  useParkingMapClickHandler,
  useParkingOsmChangeHandler,
} from '../../modes/parking/use-parking-mode-handlers'
import { useActiveStreetSpaceMode } from '../../modes/registry'
import { changesStore } from '../../utils/changes-store'
import {
  OPENFREEMAP_POSITRON_STYLE_URL,
  openFreeMapTransformStyle,
} from '../../utils/openfreemap-style'
import { useActiveMode, useAppActions, useMapBounds } from '../app-store'
import { ControlPanel } from '../controls/ControlPanel'
import { MapMobileToolbar } from '../controls/MapMobileToolbar'
import { ModeSwitcher } from '../controls/ModeSwitcher'
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
import { mapLegendClassName } from './mobileMapChrome.const'
import { serializeMapSearch } from './search-schema'
import { useSelectionBacklights } from './use-selection-backlights'
import { ViewMinZoomOverlay } from './ViewMinZoomOverlay'

const editorName = 'StreetSpace'
const version = '0.9.0'

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
  const navigate = useNavigate({ from: '/' })
  const { debug, map: mapSearch } = useSearch({ from: '/' })
  const { zoom: mapZoom } = useMapViewport()
  const queryClient = useQueryClient()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const styleTransformApplied = useRef(false)
  const maps = useMap()
  const mainMap = maps[MAIN_MAP_ID]

  const { setMapBounds, setChangesCount } = useAppActions()
  const { markMapLoaded } = useMapActions()
  const mapBounds = useMapBounds()
  const activeModeId = useActiveMode()
  const mode = useActiveStreetSpaceMode(activeModeId)
  const selectedOsmRef = useSelectedOsmRef()
  const { updateFeatureRef, clearSelection, selectionEpoch } = useFeatureSelection()

  const [cursorStyle, setCursorStyle] = useState('grab')
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [coverageHoverInfo, setCoverageHoverInfo] = useState<{
    fetchedAt: string
    kind: string
    requestIndex: number
    requestCount: number
    groupId: string
  } | null>(null)

  const { scheduleCoverageCheck, loadCoverageNow, refetchAfterSave, isBusy } =
    useParkingCoveragePace()

  useDevOsmFixtureSeed()

  const handleOsmChange = useParkingOsmChangeHandler()
  const handleLayerClick = useParkingLayerClickHandler()
  const handleMapClick = useParkingMapClickHandler()
  const handleCutLane = useParkingCutLaneHandler()
  const ModeMapLayers = mode.MapLayers
  const ModeLegend = mode.Legend

  const interactiveLayerIds = useMemo(
    () =>
      debug
        ? [...mode.interactiveLayerIds, coverageDebugFetchFillLayerId]
        : mode.interactiveLayerIds,
    [debug, mode.interactiveLayerIds],
  )

  useVisibleViewportHeightVar(true)
  useSelectionBacklights()

  const onMove = useCallback(
    (event: ViewStateChangeEvent) => {
      scheduleCoverageCheck(event.target)
    },
    [scheduleCoverageCheck],
  )

  const writeMapViewport = useCallback(
    (viewState: ViewStateChangeEvent['viewState'], bounds: ReturnType<typeof toBounds>) => {
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
    },
    [navigate, setMapBounds],
  )

  const onRotate = useCallback(
    (event: ViewStateChangeEvent) => {
      writeMapViewport(event.viewState, toBounds(event.target.getBounds()))
    },
    [writeMapViewport],
  )

  const onMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => {
      const map = event.target
      writeMapViewport(event.viewState, toBounds(map.getBounds()))
      scheduleCoverageCheck(map)
    },
    [scheduleCoverageCheck, writeMapViewport],
  )

  const onMapLoad = useCallback(
    (event: ViewStateChangeEvent) => {
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

      if (zoom >= viewMinZoom) {
        void loadCoverageNow(bounds, zoom, { mapSizePx: getMapSizePx(map) })
      }
    },
    [loadCoverageNow, mapSearch, markMapLoaded, navigate, setMapBounds],
  )

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
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
    },
    [debug],
  )

  const handleMouseLeave = useCallback(() => {
    setCursorStyle('grab')
    setHoveredGroupId(null)
    setCoverageHoverInfo(null)
  }, [])

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (event.features?.length) {
        handleLayerClick(event)
        return
      }
      handleMapClick()
    },
    [handleLayerClick, handleMapClick],
  )

  const handleSave = useCallback(async () => {
    try {
      const changedIdMap = await uploadChanges(editorName, version, changesStore)
      for (const oldId in changedIdMap) {
        const newId = changedIdMap[oldId]!
        const remappedWay = remapParkingOsmWayId(queryClient, Number(oldId), Number(newId))

        if (selectedOsmRef?.type === 'way' && selectedOsmRef.id === Number(oldId) && remappedWay) {
          updateFeatureRef({ type: 'way', id: remappedWay.id })
        }
      }
      setChangesCount(0)

      if (mapBounds && mapZoom >= viewMinZoom) {
        const maplibreMap = mainMap?.getMap()
        await refetchAfterSave(
          mapBounds,
          mapZoom,
          maplibreMap ? getMapSizePx(maplibreMap) : undefined,
        )
      }
    } catch (err) {
      if (err instanceof OsmApiRequestError) alert(err.responseText || err.message)
      else alert(err)
    }
  }, [
    mainMap,
    mapBounds,
    mapZoom,
    queryClient,
    refetchAfterSave,
    selectedOsmRef,
    setChangesCount,
    updateFeatureRef,
  ])

  const initialViewState = useMemo(
    () => ({
      longitude: initialView.longitude,
      latitude: initialView.latitude,
      zoom: initialView.zoom,
      bearing: initialView.bearing ?? 0,
    }),
    [initialView.bearing, initialView.latitude, initialView.longitude, initialView.zoom],
  )

  return (
    <AppShell
      map={
        <div ref={mapContainerRef} className="relative h-full w-full">
          <div className="fixed inset-0 z-0 lg:static lg:inset-auto lg:z-auto lg:h-full lg:w-full">
            <div className="relative h-full w-full">
              <MapGL
                id={MAIN_MAP_ID}
                mapStyle={OPENFREEMAP_POSITRON_STYLE_URL}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                maxPitch={0}
                touchPitch={false}
                pitchWithRotate={false}
                cursor={cursorStyle}
                interactiveLayerIds={interactiveLayerIds}
                onLoad={onMapLoad}
                onMove={onMove}
                onMoveEnd={onMoveEnd}
                onRotate={onRotate}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
              >
                <MapResizeHandler containerRef={mapContainerRef} />
                <AttributionControl compact position="bottom-left" />
                {debug ? <CoverageDebugLayers hoveredGroupId={hoveredGroupId} /> : null}
                <ModeMapLayers />
              </MapGL>
              <ViewMinZoomOverlay />
            </div>
          </div>

          <MapMobileToolbar onSave={() => void handleSave()} isOsmDataBusy={isBusy} />

          <div className="pointer-events-auto absolute top-4 left-2.5 z-30 hidden lg:block">
            <ModeSwitcher isOsmDataBusy={isBusy} />
          </div>

          <MapNavigationControls />

          <div className="pointer-events-auto absolute top-[calc(env(safe-area-inset-top)+3.5rem)] left-2.5 z-10 flex flex-col gap-2 lg:top-2.5">
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
          {ModeLegend ? (
            <div className={`${mapLegendClassName} lg:hidden`}>
              <ModeLegend variant="floating" />
            </div>
          ) : null}
          <div className="lg:hidden">
            <ControlPanel
              panelOnly
              mode={mode}
              onSave={() => void handleSave()}
              onCutLane={handleCutLane}
              onOsmChange={handleOsmChange}
              onClose={clearSelection}
            />
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
          onSave={() => void handleSave()}
          onCutLane={handleCutLane}
          onOsmChange={handleOsmChange}
          onClose={clearSelection}
        />
      }
    />
  )
}
