import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import { BicycleBandSource } from './BicycleBandSource'
import { BicycleCenterlineSource } from './BicycleCenterlineSource'
import type { BicycleFeatureCollection } from './parse-bikelanes'

type Props = {
  features: BicycleFeatureCollection
  selectedRef: OsmFeatureRef | null
  selectedCenterline: BicycleFeatureCollection
}

export function BicycleLayers({ features, selectedRef, selectedCenterline }: Props) {
  const { focus } = useMapFocus()

  return (
    <>
      <BicycleBandSource features={features} selectedRef={selectedRef} focus={focus} />
      <BicycleCenterlineSource collection={selectedCenterline} />
    </>
  )
}

export const bicycleInteractiveLayerIds = [
  'bicycle-highways-hitarea-layer',
  'bicycle-sidepaths-hitarea-layer',
]
