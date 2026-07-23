import type { MapLayerMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useRef } from 'react'
import { addChangedEntity } from '../../utils/changes-store'
import { osmData, resetFetchedEnvelope } from '../../utils/data-client'
import { authenticate, logout, userInfo } from '../../utils/osm-client'
import type { OsmWay } from '../../utils/types/osm-data'
import { AuthState, useAppActions, useDatetime, useEditorMode, useMapState } from '../app-store'
import { viewMinZoom } from './constants'
import {
  getLaneFeatureByOsmId,
  getParkingMapState,
  useCutMarkerFeatures,
  useLaneFeatures,
  useParkingMapActions,
} from './parking-map-store'
import { applyChangedWayToFeatures, createBacklightFeatures } from './parse-lanes'
import type { MapBounds, ParkingFeature, ParkingFeatureCollection } from './types'
import { useParkingOsmFetch } from './use-parking-osm-fetch'

export { viewMinZoom } from './constants'
export { useDatetimeColorSync, useZoomStyleSync } from './parking-map-sync'
export { useParkingOsmFetch } from './use-parking-osm-fetch'

const useDevServer = false

export function useOsmChangeHandler(zoom: number) {
  const datetime = useDatetime()
  const lanes = useLaneFeatures()
  const { updateLaneFeatures } = useParkingMapActions()
  const { setChangesCount } = useAppActions()

  return useCallback(
    (newOsm: OsmWay) => {
      const { features } = applyChangedWayToFeatures(
        lanes.features,
        newOsm,
        osmData.nodeCoords,
        datetime,
        zoom,
      )
      updateLaneFeatures(features)
      const changesCount = addChangedEntity(newOsm)
      setChangesCount(changesCount)
    },
    [datetime, lanes.features, setChangesCount, updateLaneFeatures, zoom],
  )
}

export function useLaneClickHandler(zoom: number) {
  const lanes = useLaneFeatures()
  const { setBacklights, clearBacklights, setSelectedOsmObject } = useParkingMapActions()

  return useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0] as GeoJSON.Feature | undefined
      if (!feature?.properties) return

      const osmId = feature.properties.osmId as number
      const way = osmData.ways[osmId]
      if (!way) return

      clearBacklights()
      const laneFeature = getLaneFeatureByOsmId(osmId, lanes)
      if (laneFeature?.geometry.type === 'LineString') {
        const coords = laneFeature.geometry.coordinates as [number, number][]
        setBacklights({
          type: 'FeatureCollection',
          features: createBacklightFeatures(coords, zoom),
        })
      }
      setSelectedOsmObject(way)
      event.originalEvent.stopPropagation()
    },
    [clearBacklights, lanes, setBacklights, setSelectedOsmObject, zoom],
  )
}

export function useCutWayHandler(zoom: number) {
  const datetime = useDatetime()
  const cutMarkers = useCutMarkerFeatures()
  const { setCutMarkers, clearCutMarkers, setSelectedOsmObject } = useParkingMapActions()
  const { setChangesCount } = useAppActions()
  const lanes = useLaneFeatures()
  const { updateLaneFeatures } = useParkingMapActions()
  const newWayIdRef = useRef(-1)

  const showCutMarkers = useCallback(
    (osm: OsmWay) => {
      if (cutMarkers.features.length > 0) return

      const markers: ParkingFeature[] = osm.nodes.slice(1, -1).map((nd) => {
        const coord = osmData.nodeCoords[nd]
        return {
          type: 'Feature',
          id: `cut-${nd}`,
          geometry: { type: 'Point', coordinates: [coord[1], coord[0]] },
          properties: {
            featureId: `cut-${nd}`,
            kind: 'cut-marker',
            color: '#fffc7e',
            weight: 8,
            offset: 0,
            osmType: 'node',
            osmId: nd,
            nodeId: nd,
            wayId: osm.id,
          },
        }
      })
      setCutMarkers({ type: 'FeatureCollection', features: markers })
    },
    [cutMarkers.features.length, setCutMarkers],
  )

  const handleCutMarkerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const nodeId = event.features?.[0]?.properties?.nodeId as number | undefined
      const wayId = event.features?.[0]?.properties?.wayId as number | undefined
      if (!nodeId || !wayId) return

      const oldWay = osmData.ways[wayId]
      if (!oldWay) return

      const newWay: OsmWay = JSON.parse(JSON.stringify(oldWay))
      const ndIndex = oldWay.nodes.findIndex((e) => e === nodeId)

      oldWay.nodes = oldWay.nodes.slice(0, ndIndex + 1)
      newWay.nodes = newWay.nodes.slice(ndIndex)
      newWay.id = newWayIdRef.current--
      newWay.version = 1
      delete newWay.user
      delete newWay.uid
      delete newWay.timestamp

      clearCutMarkers()

      osmData.ways[newWay.id] = newWay

      const { features: featuresWithOldWay } = applyChangedWayToFeatures(
        lanes.features,
        oldWay,
        osmData.nodeCoords,
        datetime,
        zoom,
      )
      const { features: allFeatures } = applyChangedWayToFeatures(
        featuresWithOldWay,
        newWay,
        osmData.nodeCoords,
        datetime,
        zoom,
      )
      updateLaneFeatures(allFeatures)

      const selected = getParkingMapState().selectedOsmObject
      if (selected?.id === wayId) {
        setSelectedOsmObject(oldWay)
      }

      addChangedEntity(newWay)
      const changesCount = addChangedEntity(oldWay)
      setChangesCount(changesCount)
    },
    [
      clearCutMarkers,
      datetime,
      lanes.features,
      setChangesCount,
      setSelectedOsmObject,
      updateLaneFeatures,
      zoom,
    ],
  )

  return { showCutMarkers, handleCutMarkerClick }
}

export function useEditorModeAuth() {
  const editorMode = useEditorMode()
  const mapState = useMapState()
  const { loadParkingData } = useParkingOsmFetch()
  const { setAuthState, setEditorMode } = useAppActions()
  const { removeEmptyLanes } = useParkingMapActions()

  useEffect(
    function resetWhenEditorOff() {
      if (editorMode) return
      setAuthState(AuthState.initial)
      removeEmptyLanes()
    },
    [editorMode, removeEmptyLanes, setAuthState],
  )

  useEffect(
    function authenticateWhenEditorOn() {
      if (!editorMode) return

      let cancelled = false

      void (async function authenticateEditor() {
        try {
          await authenticate(useDevServer)
          try {
            await userInfo()
          } catch {
            logout()
            await authenticate(useDevServer)
          }
          if (cancelled) return
          setAuthState(AuthState.success)
          resetFetchedEnvelope()
          if (mapState?.bounds && mapState.zoom >= viewMinZoom) {
            await loadParkingData(mapState.bounds, mapState.zoom)
          }
        } catch (err) {
          if (cancelled) return
          setAuthState(AuthState.fail)
          setEditorMode(false)
          alert(err)
        }
      })()

      return () => {
        cancelled = true
      }
    },
    [editorMode, loadParkingData, mapState, setAuthState, setEditorMode],
  )
}

export const interactiveLayerIds = [
  'parking-lanes-hitarea-layer',
  'parking-areas-layer',
  'parking-points-hitarea-layer',
  'parking-cut-markers-hitarea-layer',
]

export function toBounds(mapBounds: {
  getSouth: () => number
  getWest: () => number
  getNorth: () => number
  getEast: () => number
}): MapBounds {
  return {
    south: mapBounds.getSouth(),
    west: mapBounds.getWest(),
    north: mapBounds.getNorth(),
    east: mapBounds.getEast(),
  }
}

export function emptyCollection(): ParkingFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}
