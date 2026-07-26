import type { FeatureCollection } from 'geojson'
import { Layer, Source } from 'react-map-gl/maplibre'
import { ROUND_LINE_LAYOUT } from './map-hit-paint'
import { selectedWayCenterlinePaint } from './selected-way-centerline-paint'

type Props = {
  sourceId: string
  layerId: string
  collection: FeatureCollection
  layout?: Record<string, unknown>
}

/** Thin black centerline shown for the selected way across map modes. */
export function SelectedWayCenterlineSource({
  sourceId,
  layerId,
  collection,
  layout = ROUND_LINE_LAYOUT,
}: Props) {
  if (!collection.features.length) return null

  return (
    <Source id={sourceId} type="geojson" data={collection}>
      <Layer id={layerId} type="line" paint={selectedWayCenterlinePaint} layout={layout} />
    </Source>
  )
}
