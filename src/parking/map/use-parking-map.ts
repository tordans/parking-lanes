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
  useOsmDataSource,
} from '../app-store'
import { getUrl } from '../data-url'
import {
  getLaneFeatureByOsmId,
  useAreaFeatures,
  useCutMarkerFeatures,
  useLaneFeatures,
  useParkingMapActions,
  usePointFeatures,
} from './parking-map-store'
import {
  parseParkingAreaFeatures,
  parseParkingPointFeatures,
  parseParkingRelationFeatures,
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

export function useParkingDataLoader(bounds: MapBounds | undefined, zoom: number) {
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  const { setFetchButtonText } = useAppActions()
  const mapActions = useParkingMapActions()

  const loadParkingData = useCallback(async () => {
    if (!bounds || zoom < viewMinZoom) return

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
  }, [bounds, editorMode, mapActions, osmDataSource, setFetchButtonText, zoom])

  return loadParkingData
}

export function useDatetimeColorSync() {
  const datetime = useDatetime()
  const lanes = useLaneFeatures()
  const areas = useAreaFeatures()
  const points = usePointFeatures()
  const { updateLaneFeatures, setAreas, setPoints } = useParkingMapActions()

  useEffect(() => {
    const wayTags: Record<number, OsmWay['tags']> = {}
    for (const way of Object.values(osmData.ways)) wayTags[way.id] = way.tags

    updateLaneFeatures(updateLaneFeatureColors(lanes.features, datetime, wayTags))
    setAreas({ type: 'FeatureCollection', features: areas.features })
    setPoints({ type: 'FeatureCollection', features: points.features })
  }, [
    areas.features,
    datetime,
    lanes.features,
    points.features,
    setAreas,
    setPoints,
    updateLaneFeatures,
  ])
}

export function useZoomStyleSync(zoom: number) {
  const lanes = useLaneFeatures()
  const points = usePointFeatures()
  const { updateLaneFeatures, setPoints } = useParkingMapActions()

  useEffect(() => {
    updateLaneFeatures(updateLaneFeatureStyles(lanes.features, zoom))
    setPoints({
      type: 'FeatureCollection',
      features: updatePointFeatureStyles(points.features, zoom),
    })
  }, [lanes.features, points.features, setPoints, updateLaneFeatures, zoom])
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
  const cutMarkers = useCutMarkerFeatures()
  const { setCutMarkers, clearCutMarkers } = useParkingMapActions()
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
      const editorMode = true
      const newLaneFeatures = parseParkingLaneFeatures(newWay, osmData.nodeCoords, zoom, editorMode)
      if (newLaneFeatures.length) updateLaneFeatures([...lanes.features, ...newLaneFeatures])

      addChangedEntity(newWay)
      const changesCount = addChangedEntity(oldWay)
      setChangesCount(changesCount)
    },
    [clearCutMarkers, lanes.features, setChangesCount, updateLaneFeatures, zoom],
  )

  return { showCutMarkers, handleCutMarkerClick }
}

export function useEditorModeAuth() {
  const editorMode = useEditorMode()
  const { setAuthState, setEditorMode } = useAppActions()
  const { removeEmptyLanes } = useParkingMapActions()

  useEffect(() => {
    if (!editorMode) {
      setAuthState(AuthState.initial)
      removeEmptyLanes()
      return
    }

    void (async () => {
      try {
        await authenticate(useDevServer)
        try {
          await userInfo()
        } catch {
          logout()
          await authenticate(useDevServer)
        }
        setAuthState(AuthState.success)
        resetLastBounds()
      } catch (err) {
        setAuthState(AuthState.fail)
        setEditorMode(false)
        alert(err)
      }
    })()
  }, [editorMode, removeEmptyLanes, setAuthState, setEditorMode])
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
