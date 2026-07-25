import { Layer, Source } from 'react-map-gl/maplibre'
import { buildPointPaint, parkingHitAreaCirclePaint } from './parking-layer-paint'
import type { ParkingFeatureCollection } from './types'

export function ParkingPointsSource({
  collection,
  focus,
}: {
  collection: ParkingFeatureCollection
  focus: string
}) {
  if (!collection.features.length) return null

  return (
    <Source id="parking-points-source" type="geojson" data={collection}>
      <Layer id="parking-points-layer" type="circle" paint={buildPointPaint(focus)} />
      <Layer id="parking-points-hitarea-layer" type="circle" paint={parkingHitAreaCirclePaint} />
    </Source>
  )
}
