import { useBacklightFeatures } from '../../parking/map/parking-map-store'
import { ParkingBacklightsSource } from '../../parking/map/ParkingBacklightsSource'
import { LanesHighwaysSource } from './LanesHighwaysSource'
import type { LanesFeatureCollection } from './parse-highways'

type Props = {
  features: LanesFeatureCollection
  selectedWayId: number | null
  prevWayId: number | null
  nextWayId: number | null
}

export function LanesLayers({ features, selectedWayId, prevWayId, nextWayId }: Props) {
  const backlights = useBacklightFeatures()

  return (
    <>
      <LanesHighwaysSource
        features={features}
        selectedWayId={selectedWayId}
        prevWayId={prevWayId}
        nextWayId={nextWayId}
      />
      <ParkingBacklightsSource collection={backlights} focus="all" />
    </>
  )
}

export { lanesInteractiveLayerIds } from './LanesHighwaysSource'
