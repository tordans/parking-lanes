import type { MapLayerMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useRef } from 'react'
import { addChangedEntity } from '../../utils/changes-store'
import { downloadBbox, osmData, resetLastBounds } from '../../utils/data-client'
import { authenticate, logout, userInfo } from '../../utils/osm-client'
import type { OsmWay } from '../../utils/types/osm-data'
import {
  AuthState,
  useAppActions,
  useDatetime,
  useEditorMode,
  useMapState,
  useOsmDataSource,
} from '../app-store'
import { getUrl } from '../data-url'
import {
  getLaneFeatureByOsmId,
  getParkingMapState,
  useCutMarkerFeatures,
  useLaneFeatures,
  useParkingMapActions,
} from './parking-map-store'
import {
  parseParkingAreaFeatures,
  parseParkingPointFeatures,
  parseParkingRelationFeatures,
  updateAreaFeatureColors,
  updatePointFeatureColors,
  updatePointFeatureStyles,
} from './parse-areas-points'
import {
  applyChangedWayToFeatures,
  createBacklightFeatures,
  parseParkingLaneFeatures,
  updateLaneFeatureColors,
  updateLaneFeatureStyles,
} from './parse-lanes'
import type { MapBounds, ParkingFeature, ParkingFeatureCollection } from './types'

const useDevServer = false
export const viewMinZoom = 15

function parkingFeatureVisualsChanged(prev: ParkingFeature[], next: ParkingFeature[]): boolean {
  if (prev.length !== next.length) return true
  for (let i = 0; i < prev.length; i++) {
    if (
      prev[i]!.properties.color !== next[i]!.properties.color ||
      prev[i]!.properties.weight !== next[i]!.properties.weight
    ) {
      return true
    }
  }
  return false
}

function buildOsmTagMaps() {
  const wayTags: Record<number, OsmWay['tags']> = {}
  for (const way of Object.values(osmData.ways)) wayTags[way.id] = way.tags

  const nodeTags: Record<number, OsmWay['tags']> = {}
  for (const node of Object.values(osmData.nodes)) nodeTags[node.id] = node.tags

  const relationTags: Record<number, OsmWay['tags']> = {}
  for (const relation of Object.values(osmData.relations)) relationTags[relation.id] = relation.tags

  return { wayTags, nodeTags, relationTags }
}

export function syncDatetimeColors(datetime: Date) {
  const { lanes, areas, points, actions } = getParkingMapState()
  const { wayTags, nodeTags, relationTags } = buildOsmTagMaps()

  const updatedLanes = updateLaneFeatureColors(lanes.features, datetime, wayTags)
  if (parkingFeatureVisualsChanged(lanes.features, updatedLanes)) {
    actions.updateLaneFeatures(updatedLanes)
  }

  const updatedAreas = updateAreaFeatureColors(areas.features, datetime, wayTags, relationTags)
  if (parkingFeatureVisualsChanged(areas.features, updatedAreas)) {
    actions.setAreas({ type: 'FeatureCollection', features: updatedAreas })
  }

  const updatedPoints = updatePointFeatureColors(points.features, datetime, nodeTags)
  if (parkingFeatureVisualsChanged(points.features, updatedPoints)) {
    actions.setPoints({ type: 'FeatureCollection', features: updatedPoints })
  }
}

export function syncZoomStyles(zoom: number) {
  const { lanes, points, actions } = getParkingMapState()

  const updatedLanes = updateLaneFeatureStyles(lanes.features, zoom)
  if (parkingFeatureVisualsChanged(lanes.features, updatedLanes)) {
    actions.updateLaneFeatures(updatedLanes)
  }

  const updatedPoints = updatePointFeatureStyles(points.features, zoom)
  if (parkingFeatureVisualsChanged(points.features, updatedPoints)) {
    actions.setPoints({ type: 'FeatureCollection', features: updatedPoints })
  }
}

export function useParkingDataLoader() {
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  const datetime = useDatetime()
  const { setFetchButtonText } = useAppActions()
  const mapActions = useParkingMapActions()

  const loadParkingData = useCallback(
    async (bounds: MapBounds, zoom: number) => {
      if (zoom < viewMinZoom) return

      setFetchButtonText('Fetching data...')
      const url = getUrl(bounds, editorMode, useDevServer, osmDataSource)

      let newData
      try {
        newData = await downloadBbox(bounds, url)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : ''
        const errorMessage =
          message === 'Request failed with status code 429'
            ? 'Error: Too many requests - try again soon'
            : 'Unknown error, please try again'
        setFetchButtonText(errorMessage)
        return
      }
      setFetchButtonText('Fetch parking data')

      if (!newData) return

      const newLanes: ParkingFeature[] = []
      const newAreas: ParkingFeature[] = []
      const newPoints: ParkingFeature[] = []

      for (const relation of Object.values(newData.relations)) {
        if (relation.tags?.amenity === 'parking') {
          newAreas.push(
            ...parseParkingRelationFeatures(relation, newData.nodeCoords, newData.ways, zoom),
          )
        }
      }

      for (const way of Object.values(newData.ways)) {
        if (way.tags?.highway) {
          newLanes.push(...parseParkingLaneFeatures(way, newData.nodeCoords, zoom, editorMode))
        } else if (way.tags?.amenity === 'parking') {
          newAreas.push(...parseParkingAreaFeatures(way, newData.nodeCoords, zoom))
        }
      }

      for (const node of Object.values(newData.nodes)) {
        if (node.tags?.amenity === 'parking_entrance' || node.tags?.amenity === 'parking') {
          newPoints.push(...parseParkingPointFeatures(node, zoom))
        }
      }

      if (newLanes.length) mapActions.addLanes(newLanes)
      if (newAreas.length) mapActions.addAreas(newAreas)
      if (newPoints.length) mapActions.addPoints(newPoints)

      if (newLanes.length || newAreas.length || newPoints.length) {
        syncDatetimeColors(datetime)
      }
    },
    [datetime, editorMode, mapActions, osmDataSource, setFetchButtonText],
  )

  return loadParkingData
}

export function useDatetimeColorSync() {
  const datetime = useDatetime()

  useEffect(
    function syncDatetimeColorsEffect() {
      syncDatetimeColors(datetime)
    },
    [datetime],
  )
}

export function useZoomStyleSync(zoom: number) {
  useEffect(
    function syncZoomStylesEffect() {
      syncZoomStyles(zoom)
    },
    [zoom],
  )
}

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
  const loadParkingData = useParkingDataLoader()
  const { setAuthState, setEditorMode } = useAppActions()
  const { removeEmptyLanes } = useParkingMapActions()

  useEffect(
    function syncEditorModeAuth() {
      if (!editorMode) {
        setAuthState(AuthState.initial)
        removeEmptyLanes()
        return
      }

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
          resetLastBounds()
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
    [editorMode, loadParkingData, mapState, removeEmptyLanes, setAuthState, setEditorMode],
  )
}

export const interactiveLayerIds = [
  'parking-lanes-layer',
  'parking-areas-layer',
  'parking-points-layer',
  'parking-cut-markers-layer',
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
