import type { OsmWay } from '@osm-editor-kit/osm-data'
import { useQueryClient } from '@tanstack/react-query'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useRef } from 'react'
import { authenticate, logout, userInfo } from '../../lib/osm-client'
import { addChangedEntity } from '../../utils/changes-store'
import {
  AuthState,
  useAppActions,
  useDatetime,
  useEditorMode,
  useMapState,
  useOsmDataSource,
} from '../app-store'
import { viewMinZoom } from './constants'
import {
  getLaneFeatureByOsmId,
  useCutMarkerFeatures,
  useParkingMapActions,
  useSelectedOsmId,
} from './parking-map-store'
import { cutParkingOsmWay, updateParkingOsmWay } from './parking-osm-edits'
import { useParkingOsmQuery } from './parking-osm-query'
import { createBacklightFeatures } from './parse-lanes'
import type { MapBounds, ParkingFeature, ParkingFeatureCollection } from './types'
import { useParkingMapFeatures } from './use-parking-map-features'
import { useParkingOsmFetch, useResetParkingOsmOnSessionChange } from './use-parking-osm-fetch'

export { viewMinZoom } from './constants'
export {
  ensureParkingOsmCoverage,
  useIsParkingOsmFetching,
  useParkingOsmFetch,
  useParkingOsmQuery,
} from './use-parking-osm-fetch'
export { useParkingMapFeatures } from './use-parking-map-features'

const useDevServer = false

export function useOsmChangeHandler() {
  const queryClient = useQueryClient()
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  const { setChangesCount } = useAppActions()

  return useCallback(
    (newOsm: OsmWay) => {
      updateParkingOsmWay(queryClient, editorMode, osmDataSource, newOsm)
      const changesCount = addChangedEntity(newOsm)
      setChangesCount(changesCount)
    },
    [editorMode, osmDataSource, queryClient, setChangesCount],
  )
}

export function useLaneClickHandler(zoom: number) {
  const mapState = useMapState()
  const datetime = useDatetime()
  const editorMode = useEditorMode()
  const { lanes } = useParkingMapFeatures({
    bounds: mapState?.bounds,
    zoom,
    datetime,
    editorMode,
  })
  const { setBacklights, clearBacklights, setSelectedOsmId } = useParkingMapActions()

  return useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0] as GeoJSON.Feature | undefined
      if (!feature?.properties) return

      const osmId = feature.properties.osmId as number
      clearBacklights()
      const laneFeature = getLaneFeatureByOsmId(osmId, lanes)
      if (laneFeature?.geometry.type === 'LineString') {
        const coords = laneFeature.geometry.coordinates as [number, number][]
        setBacklights({
          type: 'FeatureCollection',
          features: createBacklightFeatures(coords, zoom),
        })
      }
      setSelectedOsmId(osmId)
      event.originalEvent.stopPropagation()
    },
    [clearBacklights, lanes, setBacklights, setSelectedOsmId, zoom],
  )
}

export function useCutWayHandler() {
  const queryClient = useQueryClient()
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  const { data: graph } = useParkingOsmQuery({ select: (data) => data.graph })
  const cutMarkers = useCutMarkerFeatures()
  const selectedOsmId = useSelectedOsmId()
  const { setCutMarkers, clearCutMarkers, setSelectedOsmId } = useParkingMapActions()
  const { setChangesCount } = useAppActions()
  const newWayIdRef = useRef(-1)

  const showCutMarkers = useCallback(
    (osm: OsmWay) => {
      if (cutMarkers.features.length > 0) return

      const nodeCoords = graph?.nodeCoords ?? {}
      const markers: ParkingFeature[] = osm.nodes.slice(1, -1).map((nd) => {
        const coord = nodeCoords[nd]!
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
    [cutMarkers.features.length, graph, setCutMarkers],
  )

  const handleCutMarkerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const nodeId = event.features?.[0]?.properties?.nodeId as number | undefined
      const wayId = event.features?.[0]?.properties?.wayId as number | undefined
      if (!nodeId || !wayId) return

      const result = cutParkingOsmWay(
        queryClient,
        editorMode,
        osmDataSource,
        wayId,
        nodeId,
        newWayIdRef.current--,
      )
      if (!result) return

      clearCutMarkers()

      if (selectedOsmId === wayId) {
        setSelectedOsmId(result.oldWay.id)
      }

      addChangedEntity(result.newWay)
      const changesCount = addChangedEntity(result.oldWay)
      setChangesCount(changesCount)
    },
    [
      clearCutMarkers,
      editorMode,
      osmDataSource,
      queryClient,
      selectedOsmId,
      setChangesCount,
      setSelectedOsmId,
    ],
  )

  return { showCutMarkers, handleCutMarkerClick }
}

export function useEditorModeAuth() {
  const editorMode = useEditorMode()
  const mapState = useMapState()
  const { loadParkingData } = useParkingOsmFetch()
  const { setAuthState, setEditorMode, setOsmDisplayName } = useAppActions()
  const { setSelectedOsmId } = useParkingMapActions()

  useResetParkingOsmOnSessionChange()

  useEffect(
    function resetWhenEditorOff() {
      if (editorMode) return
      setAuthState(AuthState.initial)
      setOsmDisplayName(null)
      setSelectedOsmId(null)
    },
    [editorMode, setAuthState, setOsmDisplayName, setSelectedOsmId],
  )

  useEffect(
    function authenticateWhenEditorOn() {
      if (!editorMode) return

      let cancelled = false

      void (async function authenticateEditor() {
        try {
          await authenticate(useDevServer)
          let displayName: string | null = null
          try {
            const info = await userInfo()
            displayName = info.display_name ?? null
          } catch {
            logout()
            await authenticate(useDevServer)
            const info = await userInfo()
            displayName = info.display_name ?? null
          }
          if (cancelled) return
          setOsmDisplayName(displayName)
          setAuthState(AuthState.success)
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
    [editorMode, loadParkingData, mapState, setAuthState, setEditorMode, setOsmDisplayName],
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

export function getMapSizePx(map: { getContainer: () => HTMLElement }): {
  width: number
  height: number
} {
  const container = map.getContainer()
  return {
    width: container.clientWidth,
    height: container.clientHeight,
  }
}

export function emptyCollection(): ParkingFeatureCollection {
  return { type: 'FeatureCollection', features: [] }
}
