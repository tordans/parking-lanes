import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { SelectedWayCenterlineSource } from '../../../shell/map/SelectedWayCenterlineSource'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import type { HandleGeometry } from '../domain/handle-geometry'
import type { WidthFeatureCollection } from './parse-highways'
import { widthLineLayout, sidepathLineLayout } from './width-layer-paint'
import { WidthHandlesLayer } from './WidthHandlesLayer'
import { WidthHighwaysBandSource } from './WidthHighwaysBandSource'

type Props = {
  features: WidthFeatureCollection
  selectedRef: OsmFeatureRef | null
  selectedCenterline: WidthFeatureCollection
  handles: HandleGeometry | null
}

export function WidthLayers({ features, selectedRef, selectedCenterline, handles }: Props) {
  const { focus } = useMapFocus()
  const selectedLayout =
    selectedCenterline.features[0]?.properties.kind === 'sidepath'
      ? sidepathLineLayout
      : widthLineLayout

  return (
    <>
      <WidthHighwaysBandSource features={features} selectedRef={selectedRef} focus={focus} />
      <SelectedWayCenterlineSource
        sourceId="width-selected-centerline-source"
        layerId="width-selected-centerline-layer"
        collection={selectedCenterline}
        layout={selectedLayout}
      />
      <WidthHandlesLayer handles={handles} />
    </>
  )
}

export const widthInteractiveLayerIds = [
  'width-highways-hitarea-layer',
  'width-sidepaths-hitarea-layer',
  'width-handles-hitarea-layer',
]
