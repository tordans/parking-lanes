import { serializeMapParam, setLocationToCookie } from '@osm-editor-kit/osm-map-url'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  AttributionControl,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { AppShell } from '../../components/AppShell'
import { OsmApiRequestError, uploadChanges } from '../../lib/osm-client'
import {
  getMapSizePx,
  remapParkingOsmWayId,
  toBounds,
  useEditorModeAuth,
  useParkingCoveragePace,
  useParkingMapActions,
  useSelectedOsmId,
  viewMinZoom,
} from '../../modes/parking'
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
import {
  useActiveMode,
  useAppActions,
  useEditorMode,
  useMapState,
  useOsmDataSource,
} from '../app-store'
import { AppInfoPanel } from '../controls/AppInfoPanel'
import { ControlPanel } from '../controls/ControlPanel'
import { CoverageDebugToggle } from '../controls/CoverageDebugToggle'
import { CoverageBusyOverlay } from './CoverageBusyOverlay'
import { coverageDebugFetchFillLayerId, CoverageDebugLayers } from './CoverageDebugLayers'
import { MapGL, MapProvider } from './map-gl'
import { MapResizeHandler } from './MapResizeHandler'

const editorName = 'StreetSpace'
const version = '0.9.0'

export function MapPage({
  initialView,
}: {
  initialView: { longitude: number; latitude: number; zoom: number }
}) {
  const navigate = useNavigate({ from: '/' })
  const { debug } = useSearch({ from: '/' })
  const queryClient = useQueryClient()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapRef>(null)
  const styleTransformApplied = useRef(false)

  const { setMapState, setChangesCount } = useAppActions()
  const mapState = useMapState()
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  const activeModeId = useActiveMode()
  const mode = useActiveStreetSpaceMode(activeModeId)
  const mapActions = useParkingMapActions()
  const selectedOsmId = useSelectedOsmId()

  const [mapZoom, setMapZoom] = useState(initialView.zoom)
  const [cursorStyle, setCursorStyle] = useState('grab')
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [coverageHoverInfo, setCoverageHoverInfo] = useState<{
    fetchedAt: string
    kind: string
    requestIndex: number
    requestCount: number
    groupId: string
  } | null>(null)

  const { scheduleCoverageCheck, loadCoverageNow, refetchAfterSave, isPending, isBusy } =
    useParkingCoveragePace()

  // Parking is the only enabled mode; handlers stay stable for Rules of Hooks.
  const handleOsmChange = useParkingOsmChangeHandler()
  const handleLayerClick = useParkingLayerClickHandler(mapZoom)
  const handleMapClick = useParkingMapClickHandler()
  const handleCutLane = useParkingCutLaneHandler()
  const ModeMapLayers = mode.MapLayers
  const ModeLegend = mode.Legend

  useEditorModeAuth()

  const onMove = useCallback(
    (event: ViewStateChangeEvent) => {
      scheduleCoverageCheck(event.target)
    },
    [scheduleCoverageCheck],
  )

  const onMoveEnd = useCallback(
    (event: ViewStateChangeEvent) => {
      const map = event.target
      const zoom = map.getZoom()
      const center = map.getCenter()
      const bounds = toBounds(map.getBounds())
      setMapZoom(zoom)

      setMapState({
        zoom,
        center: { lat: center.lat, lng: center.lng },
        bounds,
      })
      setLocationToCookie({ lat: center.lat, lng: center.lng }, zoom)

      void navigate({
        search: (prev) => ({
          ...prev,
          map: serializeMapParam({ zoom, lat: center.lat, lng: center.lng }),
        }),
        replace: true,
      })

      scheduleCoverageCheck(map)
    },
    [navigate, scheduleCoverageCheck, setMapState],
  )

  const onMapLoad = useCallback(
    (event: ViewStateChangeEvent) => {
      const map = event.target
      const zoom = map.getZoom()
      const center = map.getCenter()
      const bounds = toBounds(map.getBounds())
      setMapZoom(zoom)

      setMapState({
        zoom,
        center: { lat: center.lat, lng: center.lng },
        bounds,
      })

      if (zoom >= viewMinZoom) {
        void loadCoverageNow(bounds, zoom, { mapSizePx: getMapSizePx(map) })
      }
    },
    [loadCoverageNow, setMapState],
  )

  const handleSave = useCallback(async () => {
    try {
      const changedIdMap = await uploadChanges(editorName, version, changesStore)
      for (const oldId in changedIdMap) {
        const newId = changedIdMap[oldId]!
        const remappedWay = remapParkingOsmWayId(
          queryClient,
          editorMode,
          osmDataSource,
          Number(oldId),
          Number(newId),
        )

        if (selectedOsmId === Number(oldId) && remappedWay) {
          mapActions.setSelectedOsmId(remappedWay.id)
        }
      }
      setChangesCount(0)

      const currentMapState = mapState
      if (currentMapState?.bounds && currentMapState.zoom >= viewMinZoom) {
        const map = mapRef.current?.getMap()
        await refetchAfterSave(
          currentMapState.bounds,
          currentMapState.zoom,
          map ? getMapSizePx(map) : undefined,
        )
      }
    } catch (err) {
      if (err instanceof OsmApiRequestError) alert(err.responseText || err.message)
      else alert(err)
    }
  }, [
    editorMode,
    mapActions,
    mapState,
    osmDataSource,
    queryClient,
    refetchAfterSave,
    selectedOsmId,
    setChangesCount,
  ])

  const initialViewState = useMemo(
    () => ({
      longitude: initialView.longitude,
      latitude: initialView.latitude,
      zoom: initialView.zoom,
    }),
    [initialView.latitude, initialView.longitude, initialView.zoom],
  )

  const setMapRef = useCallback((instance: MapRef | null) => {
    mapRef.current = instance
    if (!instance || styleTransformApplied.current) return

    styleTransformApplied.current = true
    instance.getMap().setStyle(OPENFREEMAP_POSITRON_STYLE_URL, {
      transformStyle: openFreeMapTransformStyle,
    })
  }, [])

  return (
    <AppShell
      map={
        <div ref={mapContainerRef} className="relative h-full w-full">
          <MapProvider>
            <MapGL
              ref={setMapRef}
              id="main-map"
              mapStyle={OPENFREEMAP_POSITRON_STYLE_URL}
              initialViewState={initialViewState}
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
              cursor={cursorStyle}
              interactiveLayerIds={mode.interactiveLayerIds}
              onLoad={onMapLoad}
              onMove={onMove}
              onMoveEnd={onMoveEnd}
              onMouseMove={(event: MapLayerMouseEvent) => {
                const layerId = event.features?.[0]?.layer?.id
                if (layerId && mode.interactiveLayerIds.includes(layerId)) {
                  setCursorStyle('pointer')
                } else {
                  setCursorStyle('grab')
                }

                if (!debug) {
                  setHoveredGroupId(null)
                  setCoverageHoverInfo(null)
                  return
                }

                const debugFeatures = event.target.queryRenderedFeatures(event.point, {
                  layers: [coverageDebugFetchFillLayerId],
                })
                const debugFeature = debugFeatures[0]
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
              }}
              onMouseLeave={() => {
                setCursorStyle('grab')
                setHoveredGroupId(null)
                setCoverageHoverInfo(null)
              }}
              onClick={(event: MapLayerMouseEvent) => {
                if (event.features?.length) {
                  handleLayerClick(event)
                  return
                }
                handleMapClick()
              }}
              onMouseDown={(e: MapLayerMouseEvent) => e.originalEvent.stopPropagation()}
              onDblClick={(e: MapLayerMouseEvent) => e.originalEvent.stopPropagation()}
            >
              <MapResizeHandler containerRef={mapContainerRef} />
              <AttributionControl compact position="bottom-left" />
              {debug ? <CoverageDebugLayers hoveredGroupId={hoveredGroupId} /> : null}
              <ModeMapLayers mapZoom={mapZoom} />
            </MapGL>
          </MapProvider>

          <CoverageBusyOverlay pending={isPending} fetching={isBusy && !isPending} />
          <div className="pointer-events-auto absolute top-2.5 left-2.5 z-10 flex flex-col gap-2">
            <CoverageDebugToggle />
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
            <div className="pointer-events-auto absolute bottom-8 left-2.5 z-10">
              <ModeLegend />
            </div>
          ) : null}
          <div className="pointer-events-auto absolute right-2.5 bottom-2.5 z-10">
            <AppInfoPanel />
          </div>
        </div>
      }
      panel={
        <ControlPanel
          mode={mode}
          onFetch={() => {
            if (!mapState?.bounds) return
            const map = mapRef.current?.getMap()
            void loadCoverageNow(mapState.bounds, mapState.zoom, {
              mapSizePx: map ? getMapSizePx(map) : undefined,
            })
          }}
          onSave={() => void handleSave()}
          onCutLane={handleCutLane}
          onOsmChange={handleOsmChange}
          onClose={() => {
            mapActions.clearBacklights()
            mapActions.setSelectedOsmId(null)
          }}
        />
      }
    />
  )
}
