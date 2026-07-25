import 'maplibre-gl/dist/maplibre-gl.css'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import { ParkingAreasSource } from './ParkingAreasSource'
import { ParkingBacklightsSource } from './ParkingBacklightsSource'
import { ParkingLanesSource } from './ParkingLanesSource'
import { ParkingPointsSource } from './ParkingPointsSource'
import type { ParkingFeatureCollection } from './types'

export function ParkingLayers({
  lanes,
  areas,
  points,
  backlights,
}: {
  lanes: ParkingFeatureCollection
  areas: ParkingFeatureCollection
  points: ParkingFeatureCollection
  backlights: ParkingFeatureCollection
}) {
  const { focus } = useMapFocus()
  const parkingFocus = focus === 'noSurface' ? 'noSurface' : 'all'

  return (
    <>
      <ParkingAreasSource collection={areas} focus={parkingFocus} />
      <ParkingLanesSource collection={lanes} focus={parkingFocus} />
      <ParkingPointsSource collection={points} focus={parkingFocus} />
      <ParkingBacklightsSource collection={backlights} focus={parkingFocus} />
    </>
  )
}
