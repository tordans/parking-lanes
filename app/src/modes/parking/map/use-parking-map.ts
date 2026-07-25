import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { AuthState, useAppActions, useAuthState } from '../../../shell/app-store'
import { useFeatureSelection } from '../../../shell/map/feature-selection'
import { getOsmWayFromSession } from '../../../shell/map/osm-session-way-edits'
import { addChangedEntity } from '../../../utils/changes-store'
import { updateParkingOsmWay } from './parking-osm-edits'
import type { MapBounds, ParkingFeatureCollection } from './types'

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
      const original = getOsmWayFromSession(queryClient, newOsm.id)
      updateParkingOsmWay(queryClient, newOsm)
      const changesCount = addChangedEntity(newOsm, { original, source: 'parking' })
      setChangesCount(changesCount)
    },
    [authState, queryClient, setChangesCount],
  )
}

export function useLaneClickHandler() {
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

export const interactiveLayerIds = [
  'parking-lanes-hitarea-layer',
  'parking-areas-layer',
  'parking-points-hitarea-layer',
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
