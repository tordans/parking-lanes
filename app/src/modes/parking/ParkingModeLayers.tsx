import { useDatetime, useMapState } from '../../shell/app-store'
import type { ModeMapProps } from '../types'
import { useBacklightFeatures, useCutMarkerFeatures } from './map/parking-map-store'
import { ParkingLayers } from './map/ParkingLayers'
import { useParkingMapFeatures } from './map/use-parking-map-features'

export function ParkingModeLayers({ mapZoom }: ModeMapProps) {
  const mapState = useMapState()
  const datetime = useDatetime()
  const backlights = useBacklightFeatures()
  const cutMarkers = useCutMarkerFeatures()

  const { lanes, areas, points } = useParkingMapFeatures({
    bounds: mapState?.bounds,
    zoom: mapZoom,
    datetime,
  })

  return (
    <ParkingLayers
      lanes={lanes}
      areas={areas}
      points={points}
      backlights={backlights}
      cutMarkers={cutMarkers}
    />
  )
}
