import { Layer, Source } from 'react-map-gl/maplibre'
import { buildAreaPaint } from './parking-layer-paint'
import type { ParkingFeatureCollection } from './types'

export function ParkingAreasSource({
  collection,
  focus,
}: {
  collection: ParkingFeatureCollection
  focus: string
}) {
  if (!collection.features.length) return null

  return (
    <Source id="parking-areas-source" type="geojson" data={collection}>
      <Layer id="parking-areas-layer" type="fill" paint={buildAreaPaint(focus)} />
    </Source>
  )
}
