import { useDatetime, useMapBounds } from '../../shell/app-store'
import { useSelectedOsmRef } from '../../shell/map/feature-selection-store'
import { useMapViewport } from '../../shell/map/map-viewport'
import type { ModeMapProps } from '../types'
import { useBacklightFeatures } from './map/parking-map-store'
import { ParkingLayers } from './map/ParkingLayers'
import { useParkingMapFeatures } from './map/use-parking-map-features'

export function ParkingModeLayers(_props: ModeMapProps) {
  const mapBounds = useMapBounds()
  const { zoom } = useMapViewport()
  const datetime = useDatetime()
  const backlights = useBacklightFeatures()
  const selectedOsmRef = useSelectedOsmRef()
  const selectedWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : null

  const { lanes, areas, points } = useParkingMapFeatures({
    bounds: mapBounds,
    zoom,
    datetime,
  })

  return (
    <ParkingLayers
      lanes={lanes}
      areas={areas}
      points={points}
      backlights={backlights}
      selectedWayId={selectedWayId}
    />
  )
}
