import { useNavigate } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import {
  AttributionControl,
  type MapLayerMouseEvent,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre'
import { changesStore } from '../../utils/changes-store'
import { osmData } from '../../utils/data-client'
import { setLocationToCookie } from '../../utils/location-cookie'
import { serializeMapParam } from '../../utils/map-param'
import { OsmApiRequestError, uploadChanges } from '../../utils/osm-client'
import type { OsmWay } from '../../utils/types/osm-data'
import { useAppActions, useMapState } from '../app-store'
import { AppInfoPanel } from '../controls/AppInfoPanel'
import { ControlPanel } from '../controls/ControlPanel'
import { LegendPanel } from '../controls/LegendPanel'
import {
  useAreaFeatures,
  useBacklightFeatures,
  useCutMarkerFeatures,
  useLaneFeatures,
  getParkingMapState,
  useParkingMapActions,
  usePointFeatures,
} from './parking-map-store'
import { MapGL, MapProvider, ParkingLayers } from './ParkingLayers'
import { useMapStyle } from './use-map-style'
import {
  interactiveLayerIds,
  toBounds,
  useCutWayHandler,
  useDatetimeColorSync,
  useEditorModeAuth,
  useLaneClickHandler,
  useOsmChangeHandler,
  useParkingOsmFetch,
  useZoomStyleSync,
  viewMinZoom,
} from './use-parking-map'

const editorName = 'PLanes'
const version = '0.9.0'

export function MapPage({
  initialView,
}: {
  initialView: { longitude: number; latitude: number; zoom: number }
}) {
  const navigate = useNavigate({ from: '/' })

  const { setMapState, setChangesCount } = useAppActions()
  const mapState = useMapState()
  const mapActions = useParkingMapActions()
  const lanes = useLaneFeatures()
  const areas = useAreaFeatures()
  const points = usePointFeatures()
  const backlights = useBacklightFeatures()
  const cutMarkers = useCutMarkerFeatures()

  const { data: mapStyle } = useMapStyle()

  const [mapZoom, setMapZoom] = useState(initialView.zoom)
  const [cursorStyle, setCursorStyle] = useState('grab')

  const { loadParkingData, refetchAfterSave } = useParkingOsmFetch()
  const handleOsmChange = useOsmChangeHandler(mapZoom)
  const handleLaneClick = useLaneClickHandler(mapZoom)
  const { showCutMarkers, handleCutMarkerClick } = useCutWayHandler(mapZoom)

  useDatetimeColorSync()
  useZoomStyleSync(mapZoom)
  useEditorModeAuth()

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
        search: {
          map: serializeMapParam({ zoom, lat: center.lat, lng: center.lng }),
        },
        replace: true,
      })

      if (zoom >= viewMinZoom) void loadParkingData(bounds, zoom)
    },
    [loadParkingData, navigate, setMapState],
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

      if (zoom >= viewMinZoom) void loadParkingData(bounds, zoom)
    },
    [loadParkingData, setMapState],
  )

  const onMapClick = useCallback(() => {
    mapActions.clearBacklights()
    mapActions.setSelectedOsmObject(null)
  }, [mapActions])

  const onLayerClick = useCallback(
    (event: Parameters<typeof handleLaneClick>[0]) => {
      const layerId = event.features?.[0]?.layer?.id
      if (layerId === 'parking-cut-markers-hitarea-layer') {
        handleCutMarkerClick(event)
        return
      }
      handleLaneClick(event)
    },
    [handleCutMarkerClick, handleLaneClick],
  )

  const handleSave = useCallback(async () => {
    try {
      const changedIdMap = await uploadChanges(editorName, version, changesStore)
      for (const oldId in changedIdMap) {
        const newId = changedIdMap[oldId]
        const oldWay = osmData.ways[Number(oldId)]
        if (oldWay) {
          delete osmData.ways[Number(oldId)]
          oldWay.id = Number(newId)
          osmData.ways[Number(newId)] = oldWay
        }

        const updated = lanes.features.map((feature) => {
          if (feature.properties.osmId !== Number(oldId)) return feature
          const side = feature.properties.featureId.replace(String(oldId), '')
          return {
            ...feature,
            properties: {
              ...feature.properties,
              featureId: side + newId,
              osmId: Number(newId),
            },
          }
        })
        mapActions.updateLaneFeatures(updated)

        const selected = getParkingMapState().selectedOsmObject
        if (selected && selected.id === Number(oldId) && oldWay) {
          mapActions.setSelectedOsmObject(oldWay)
        }
      }
      setChangesCount(0)

      const currentMapState = mapState
      if (currentMapState?.bounds && currentMapState.zoom >= viewMinZoom) {
        await refetchAfterSave(currentMapState.bounds, currentMapState.zoom)
      }
    } catch (err) {
      if (err instanceof OsmApiRequestError) alert(err.responseText || err.message)
      else alert(err)
    }
  }, [lanes.features, mapActions, mapState, refetchAfterSave, setChangesCount])

  const handleCutLane = useCallback(
    (way: OsmWay) => {
      showCutMarkers(way)
    },
    [showCutMarkers],
  )

  const initialViewState = useMemo(
    () => ({
      longitude: initialView.longitude,
      latitude: initialView.latitude,
      zoom: initialView.zoom,
    }),
    [initialView.latitude, initialView.longitude, initialView.zoom],
  )

  return (
    <div className="app">
      <MapProvider>
        {mapStyle ? (
          <MapGL
            id="main-map"
            mapStyle={mapStyle}
            initialViewState={initialViewState}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            cursor={cursorStyle}
            interactiveLayerIds={interactiveLayerIds}
            onLoad={onMapLoad}
            onMoveEnd={onMoveEnd}
            onMouseMove={(event: MapLayerMouseEvent) => {
              const layerId = event.features?.[0]?.layer?.id
              if (layerId && interactiveLayerIds.includes(layerId)) {
                setCursorStyle('pointer')
              } else {
                setCursorStyle('grab')
              }
            }}
            onMouseLeave={() => {
              setCursorStyle('grab')
            }}
            onClick={(event: MapLayerMouseEvent) => {
              if (event.features?.length) {
                onLayerClick(event)
                return
              }
              onMapClick()
            }}
            onMouseDown={(e: MapLayerMouseEvent) => e.originalEvent.stopPropagation()}
            onDblClick={(e: MapLayerMouseEvent) => e.originalEvent.stopPropagation()}
          >
            <AttributionControl compact position="bottom-left" />
            <ParkingLayers
              lanes={lanes}
              areas={areas}
              points={points}
              backlights={backlights}
              cutMarkers={cutMarkers}
            />
          </MapGL>
        ) : null}
      </MapProvider>

      <div className="map-overlay map-overlay--bottom-left">
        <LegendPanel />
      </div>
      <div className="map-overlay map-overlay--bottom-right">
        <AppInfoPanel />
      </div>
      <div id="panel" className="panel">
        <ControlPanel
          onFetch={() => {
            if (mapState?.bounds) void loadParkingData(mapState.bounds, mapState.zoom)
          }}
          onSave={() => void handleSave()}
          onCutLane={handleCutLane}
          onOsmChange={handleOsmChange}
          onClose={() => {
            mapActions.clearBacklights()
            mapActions.setSelectedOsmObject(null)
          }}
        />
      </div>
    </div>
  )
}
