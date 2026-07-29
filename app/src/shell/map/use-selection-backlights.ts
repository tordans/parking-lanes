import { useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useLanesMapFeatures } from '../../modes/lanes/map/use-lanes-map-features'
import {
  getLaneFeatureByOsmId,
  useParkingMapActions,
} from '../../modes/parking/map/parking-map-store'
import { createBacklightFeatures } from '../../modes/parking/map/parse-lanes'
import { useParkingMapFeatures } from '../../modes/parking/map/use-parking-map-features'
import { useDatetime, useMapBounds } from '../app-store'
import { useSelectedOsmRef } from './feature-selection-store'
import { useMapViewport } from './map-viewport'

/** Restore lane backlights when selection is hydrated from URL after data loads. */
export function useSelectionBacklights() {
  const { mode } = useParams({ from: '/$mode' })
  const mapBounds = useMapBounds()
  const { zoom } = useMapViewport()
  const datetime = useDatetime()
  const selectedOsmRef = useSelectedOsmRef()
  const { setBacklights, clearBacklights } = useParkingMapActions()
  const { lanes } = useParkingMapFeatures({
    bounds: mapBounds,
    zoom,
    datetime,
  })
  const lanesHighways = useLanesMapFeatures({ bounds: mapBounds })

  useEffect(
    function syncSelectionBacklights() {
      if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
        clearBacklights()
        return
      }

      const lineFeature =
        mode === 'lanes'
          ? lanesHighways.features.find((f) => f.properties.osmId === selectedOsmRef.id)
          : getLaneFeatureByOsmId(selectedOsmRef.id, lanes)

      if (lineFeature?.geometry.type !== 'LineString') {
        clearBacklights()
        return
      }

      const coords = lineFeature.geometry.coordinates as [number, number][]
      setBacklights({
        type: 'FeatureCollection',
        features: createBacklightFeatures(coords, zoom),
      })
    },
    [clearBacklights, lanes, lanesHighways, mode, zoom, selectedOsmRef, setBacklights],
  )
}
