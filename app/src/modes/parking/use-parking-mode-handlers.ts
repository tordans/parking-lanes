import type { OsmWay } from '@osm-editor-kit/osm-data'
import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { useFeatureSelection } from '../../shell/map/feature-selection'
import { useCutWayHandler, useLaneClickHandler, useOsmChangeHandler } from './map/use-parking-map'

export function useParkingLayerClickHandler(mapZoom: number) {
  const handleLaneClick = useLaneClickHandler(mapZoom)
  const { handleCutMarkerClick } = useCutWayHandler()

  return useCallback(
    (event: MapLayerMouseEvent) => {
      const layerId = event.features?.[0]?.layer?.id
      if (layerId === 'parking-cut-markers-hitarea-layer') {
        handleCutMarkerClick(event)
        return
      }
      handleLaneClick(event)
    },
    [handleCutMarkerClick, handleLaneClick],
  )
}

export function useParkingMapClickHandler() {
  const { clearSelection } = useFeatureSelection()

  return useCallback(() => {
    clearSelection()
  }, [clearSelection])
}

export function useParkingCutLaneHandler() {
  const { showCutMarkers } = useCutWayHandler()

  return useCallback(
    (way: OsmWay) => {
      showCutMarkers(way)
    },
    [showCutMarkers],
  )
}

export { useOsmChangeHandler as useParkingOsmChangeHandler }
