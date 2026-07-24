import { useEffect } from 'react'
import {
  getLaneFeatureByOsmId,
  useParkingMapActions,
} from '../../modes/parking/map/parking-map-store'
import { createBacklightFeatures } from '../../modes/parking/map/parse-lanes'
import { useParkingMapFeatures } from '../../modes/parking/map/use-parking-map-features'
import { useDatetime, useMapState } from '../app-store'
import { useSelectedOsmRef } from './feature-selection'

/** Restore lane backlights when selection is hydrated from URL after data loads. */
export function useSelectionBacklights(mapZoom: number) {
  const mapState = useMapState()
  const datetime = useDatetime()
  const selectedOsmRef = useSelectedOsmRef()
  const { setBacklights, clearBacklights } = useParkingMapActions()
  const { lanes } = useParkingMapFeatures({
    bounds: mapState?.bounds,
    zoom: mapZoom,
    datetime,
  })

  useEffect(
    function syncSelectionBacklights() {
      if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
        clearBacklights()
        return
      }

      const laneFeature = getLaneFeatureByOsmId(selectedOsmRef.id, lanes)
      if (laneFeature?.geometry.type !== 'LineString') {
        clearBacklights()
        return
      }

      const coords = laneFeature.geometry.coordinates as [number, number][]
      setBacklights({
        type: 'FeatureCollection',
        features: createBacklightFeatures(coords, mapZoom),
      })
    },
    [clearBacklights, lanes, mapZoom, selectedOsmRef, setBacklights],
  )
}
