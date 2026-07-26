import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { SelectedWayCenterlineSource } from '../../../shell/map/SelectedWayCenterlineSource'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import { bicycleLineLayout, sidepathLineLayout } from './bicycle-layer-paint'
import { BicycleBandSource } from './BicycleBandSource'
import type { BicycleFeatureCollection } from './parse-bikelanes'

type Props = {
  features: BicycleFeatureCollection
  selectedRef: OsmFeatureRef | null
  selectedCenterline: BicycleFeatureCollection
}

export function BicycleLayers({ features, selectedRef, selectedCenterline }: Props) {
  const { focus } = useMapFocus()
  const selectedLayout =
    selectedCenterline.features[0]?.properties.kind === 'sidepath'
      ? sidepathLineLayout
      : bicycleLineLayout

  return (
    <>
      <BicycleBandSource features={features} selectedRef={selectedRef} focus={focus} />
      <SelectedWayCenterlineSource
        sourceId="bicycle-selected-centerline-source"
        layerId="bicycle-selected-centerline-layer"
        collection={selectedCenterline}
        layout={selectedLayout}
      />
    </>
  )
}

export const bicycleInteractiveLayerIds = [
  'bicycle-highways-hitarea-layer',
  'bicycle-sidepaths-hitarea-layer',
]
