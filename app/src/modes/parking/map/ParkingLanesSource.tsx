import { Layer, Source } from 'react-map-gl/maplibre'
import { buildLanePaint, parkingHitAreaLinePaint, parkingLineLayout } from './parking-layer-paint'
import type { ParkingFeatureCollection } from './types'

export function ParkingLanesSource({
  collection,
  focus,
}: {
  collection: ParkingFeatureCollection
  focus: string
}) {
  if (!collection.features.length) return null

  return (
    <Source id="parking-lanes-source" type="geojson" data={collection}>
      <Layer
        id="parking-lanes-layer"
        type="line"
        paint={buildLanePaint(focus)}
        layout={parkingLineLayout}
      />
      <Layer
        id="parking-lanes-hitarea-layer"
        type="line"
        paint={parkingHitAreaLinePaint}
        layout={parkingLineLayout}
      />
    </Source>
  )
}
