import { Layer, Source } from 'react-map-gl/maplibre'
import {
  bicycleLineLayout,
  selectedCenterlinePaint,
  sidepathLineLayout,
} from './bicycle-layer-paint'
import type { BicycleFeatureCollection } from './parse-bikelanes'

export function BicycleCenterlineSource({ collection }: { collection: BicycleFeatureCollection }) {
  if (!collection.features.length) return null

  const layout =
    collection.features[0]?.properties.kind === 'sidepath' ? sidepathLineLayout : bicycleLineLayout

  return (
    <Source id="bicycle-selected-centerline-source" type="geojson" data={collection}>
      <Layer
        id="bicycle-selected-centerline-layer"
        type="line"
        paint={selectedCenterlinePaint}
        layout={layout}
      />
    </Source>
  )
}
