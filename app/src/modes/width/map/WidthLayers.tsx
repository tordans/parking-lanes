import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import type { HandleGeometry } from '../domain/handle-geometry'
import type { WidthFeatureCollection } from './parse-highways'
import { WidthHandlesLayer } from './WidthHandlesLayer'
import { WidthHighwaysBandSource } from './WidthHighwaysBandSource'
import { WidthSelectedCenterlineSource } from './WidthSelectedCenterlineSource'

type Props = {
  features: WidthFeatureCollection
  selectedRef: OsmFeatureRef | null
  selectedCenterline: WidthFeatureCollection
  handles: HandleGeometry | null
}

export function WidthLayers({ features, selectedRef, selectedCenterline, handles }: Props) {
  const { focus } = useMapFocus()

  return (
    <>
      <WidthHighwaysBandSource features={features} selectedRef={selectedRef} focus={focus} />
      <WidthSelectedCenterlineSource collection={selectedCenterline} />
      <WidthHandlesLayer handles={handles} />
    </>
  )
}

export const widthInteractiveLayerIds = [
  'width-highways-hitarea-layer',
  'width-sidepaths-hitarea-layer',
  'width-handles-hitarea-layer',
]
