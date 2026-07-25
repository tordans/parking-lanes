import { Layer, Source } from 'react-map-gl/maplibre'
import type { WidthFeatureCollection } from './parse-highways'
import { selectedCenterlinePaint, widthLineLayout } from './width-layer-paint'

export function WidthSelectedCenterlineSource({
  collection,
}: {
  collection: WidthFeatureCollection
}) {
  if (!collection.features.length) return null

  return (
    <Source id="width-selected-centerline-source" type="geojson" data={collection}>
      <Layer
        id="width-selected-centerline-layer"
        type="line"
        paint={selectedCenterlinePaint}
        layout={widthLineLayout}
      />
    </Source>
  )
}
