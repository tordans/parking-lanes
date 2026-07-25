import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { useFeatureSelection } from '../../shell/map/feature-selection'
import { useLaneClickHandler, useOsmChangeHandler } from './map/use-parking-map'

export function useParkingLayerClickHandler() {
  const handleLaneClick = useLaneClickHandler()

  return useCallback(
    (event: MapLayerMouseEvent) => {
      handleLaneClick(event)
    },
    [handleLaneClick],
  )
}

export function useParkingMapClickHandler() {
  const { clearSelection } = useFeatureSelection()

  return useCallback(() => {
    clearSelection()
  }, [clearSelection])
}

export { useOsmChangeHandler as useParkingOsmChangeHandler }
