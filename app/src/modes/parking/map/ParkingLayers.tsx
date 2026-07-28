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
  selectedWayId,
}: {
  lanes: ParkingFeatureCollection
  areas: ParkingFeatureCollection
  points: ParkingFeatureCollection
  backlights: ParkingFeatureCollection
  selectedWayId: number | null
}) {
  const { focus } = useMapFocus()
  const parkingFocus = focus === 'noSurface' ? 'noSurface' : 'all'

  // Tagged ways use selected lane bands (sidebar colors). Missing/untagged ways have no
  // lane bands — show selection backlights so left/right chrome still appears.
  const selectedHasLaneBands =
    selectedWayId != null &&
    lanes.features.some(
      (feature) => feature.properties.kind === 'lane' && feature.properties.osmId === selectedWayId,
    )
  const showSelectionBacklights = selectedWayId != null && !selectedHasLaneBands

  return (
    <>
      <ParkingAreasSource collection={areas} focus={parkingFocus} />
      <ParkingLanesSource collection={lanes} focus={parkingFocus} selectedWayId={selectedWayId} />
      <ParkingPointsSource collection={points} focus={parkingFocus} />
      {showSelectionBacklights ? (
        <ParkingBacklightsSource
          collection={backlights}
          focus={parkingFocus}
          beforeId="parking-centerlines-layer"
        />
      ) : null}
    </>
  )
}
