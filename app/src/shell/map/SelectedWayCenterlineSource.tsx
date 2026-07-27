import type { FeatureCollection } from 'geojson'
import { Layer, Source } from 'react-map-gl/maplibre'
import { ROUND_LINE_LAYOUT } from './map-hit-paint'
import { selectedWayCenterlinePaint } from './selected-way-centerline-paint'

type Props = {
  sourceId: string
  layerId: string
  collection: FeatureCollection
  layout?: Record<string, unknown>
  /** Merged onto {@link selectedWayCenterlinePaint} (e.g. sidepath `line-offset`). */
  paint?: Record<string, unknown>
}

/** Thin black centerline shown for the selected way across map modes. */
export function SelectedWayCenterlineSource({
  sourceId,
  layerId,
  collection,
  layout = ROUND_LINE_LAYOUT,
  paint,
}: Props) {
  if (!collection.features.length) return null

  return (
    <Source id={sourceId} type="geojson" data={collection}>
      <Layer
        id={layerId}
        type="line"
        paint={{ ...selectedWayCenterlinePaint, ...paint }}
        layout={layout}
      />
    </Source>
  )
}
