import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { useFeatureSelectionActions } from '../../../shell/map/feature-selection-store'
import { useOsmChangeHandler as useSharedOsmChangeHandler } from '../../../shell/map/use-osm-change-handler'
import { parkingMissingHitAreaLayerId } from './ParkingLanesSource'
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
  return useSharedOsmChangeHandler('parking')
}

export function useLaneClickHandler() {
  const { selectFeature } = useFeatureSelectionActions()

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
  'parking-selected-lanes-hitarea-layer',
  parkingMissingHitAreaLayerId,
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
