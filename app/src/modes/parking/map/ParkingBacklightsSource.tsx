import { Layer, Source } from 'react-map-gl/maplibre'
import { buildBacklightPaint, parkingLineLayout } from './parking-layer-paint'
import type { ParkingFeatureCollection } from './types'

export function ParkingBacklightsSource({
  collection,
  focus,
}: {
  collection: ParkingFeatureCollection
  focus: string
}) {
  if (!collection.features.length) return null

  return (
    <Source id="parking-backlights-source" type="geojson" data={collection}>
      <Layer
        id="parking-backlights-layer"
        type="line"
        paint={buildBacklightPaint(focus)}
        layout={parkingLineLayout}
      />
    </Source>
  )
}
