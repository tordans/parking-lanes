import type { StreetSpaceMode } from '../types'
import { LegendPanel } from './controls/LegendPanel'
import { interactiveLayerIds } from './map/use-parking-map'
import { ParkingModeLayers } from './ParkingModeLayers'
import { ParkingModePanel } from './ParkingModePanel'

export const parkingMode: StreetSpaceMode = {
  id: 'parking',
  label: 'Parking',
  enabled: true,
  MapLayers: ParkingModeLayers,
  Panel: ParkingModePanel,
  Legend: LegendPanel,
  interactiveLayerIds,
}

export { useOsmAuth } from './map/use-osm-auth'
export { remapParkingOsmWayId } from './map/parking-osm-edits'
export { useParkingCoveragePace } from './map/use-parking-coverage-pace'
export { useSelectedOsmId, useSelectedOsmRef, useParkingMapActions } from './map/parking-map-store'
export { viewMinZoom, getMapSizePx, toBounds } from './map/use-parking-map'
