import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { AuthState, useAppActions, useAuthState } from '../../../shell/app-store'
import { useFeatureSelection, useSelectedOsmRef } from '../../../shell/map/feature-selection'
import { addChangedEntity } from '../../../utils/changes-store'
import { useCutMarkerFeatures, useParkingMapActions } from './parking-map-store'
import { cutParkingOsmWay, updateParkingOsmWay } from './parking-osm-edits'
import { useParkingOsmQuery } from './parking-osm-query'
import type { MapBounds, ParkingFeature, ParkingFeatureCollection } from './types'

export { viewMinZoom } from './constants'
export {
  ensureParkingOsmCoverage,
  useIsParkingOsmFetching,
  useParkingOsmFetch,
  useParkingOsmQuery,
} from './use-parking-osm-fetch'
export { useParkingMapFeatures } from './use-parking-map-features'
export { useOsmAuth } from './use-osm-auth'

export function useOsmChangeHandler() {
  const queryClient = useQueryClient()
  const authState = useAuthState()
  const { setChangesCount } = useAppActions()

  return useCallback(
    (newOsm: OsmWay) => {
      if (authState !== AuthState.success) return
      updateParkingOsmWay(queryClient, newOsm)
      const changesCount = addChangedEntity(newOsm)
      setChangesCount(changesCount)
    },
    [authState, queryClient, setChangesCount],
  )
}

export function useLaneClickHandler(_mapZoom: number) {
  const { selectFeature } = useFeatureSelection()

  return useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0] as GeoJSON.Feature | undefined
      if (!feature?.properties) return

      const osmId = feature.properties.osmId as number
      const osmType = feature.properties.osmType as OsmFeatureRef['type']
      selectFeature({ type: osmType, id: osmId })
      event.originalEvent.stopPropagation()
    },
    [selectFeature],
  )
}

export function useCutWayHandler() {
  const queryClient = useQueryClient()
  const authState = useAuthState()
  const { data: graph } = useParkingOsmQuery({ select: (data) => data.graph })
  const cutMarkers = useCutMarkerFeatures()
  const selectedOsmRef = useSelectedOsmRef()
  const { setCutMarkers, clearCutMarkers } = useParkingMapActions()
  const { updateFeatureRef } = useFeatureSelection()
  const { setChangesCount } = useAppActions()
  const newWayIdRef = useRef(-1)

  const showCutMarkers = useCallback(
    (osm: OsmWay) => {
      if (authState !== AuthState.success) return
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
    [authState, cutMarkers.features.length, graph, setCutMarkers],
  )

  const handleCutMarkerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (authState !== AuthState.success) return

      const nodeId = event.features?.[0]?.properties?.nodeId as number | undefined
      const wayId = event.features?.[0]?.properties?.wayId as number | undefined
      if (!nodeId || !wayId) return

      const result = cutParkingOsmWay(queryClient, wayId, nodeId, newWayIdRef.current--)
      if (!result) return

      clearCutMarkers()

      if (selectedOsmRef?.type === 'way' && selectedOsmRef.id === wayId) {
        updateFeatureRef({ type: 'way', id: result.oldWay.id })
      }

      addChangedEntity(result.newWay)
      const changesCount = addChangedEntity(result.oldWay)
      setChangesCount(changesCount)
    },
    [authState, clearCutMarkers, queryClient, selectedOsmRef, setChangesCount, updateFeatureRef],
  )

  return { showCutMarkers, handleCutMarkerClick }
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
