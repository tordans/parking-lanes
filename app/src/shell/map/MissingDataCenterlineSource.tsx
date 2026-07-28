import type { FeatureCollection } from 'geojson'
import { Layer, Source } from 'react-map-gl/maplibre'
import { ROUND_LINE_LAYOUT } from './map-hit-paint'
import {
  missingDataCenterlinePaint,
  missingDataDottedOverlayPaint,
  missingDataHitAreaPaint,
} from './missing-data-paint'

type Props = {
  sourceId: string
  /** Base id; layers become `{layerIdPrefix}-pink-layer`, `-dotted-layer`, `-hitarea-layer`. */
  layerIdPrefix: string
  collection: FeatureCollection
  layout?: Record<string, unknown>
  /** Merged onto all three paints (e.g. sidepath `line-offset`). */
  paint?: Record<string, unknown>
}

export function missingDataHitAreaLayerId(layerIdPrefix: string) {
  return `${layerIdPrefix}-hitarea-layer`
}

/** Pink centerline + black dots + hitarea for missing / untagged ways. */
export function MissingDataCenterlineSource({
  sourceId,
  layerIdPrefix,
  collection,
  layout = ROUND_LINE_LAYOUT,
  paint,
}: Props) {
  if (!collection.features.length) return null

  return (
    <Source id={sourceId} type="geojson" data={collection}>
      <Layer
        id={`${layerIdPrefix}-pink-layer`}
        type="line"
        paint={{ ...missingDataCenterlinePaint, ...paint }}
        layout={layout}
      />
      <Layer
        id={`${layerIdPrefix}-dotted-layer`}
        type="line"
        paint={{ ...missingDataDottedOverlayPaint, ...paint }}
        layout={layout}
      />
      <Layer
        id={missingDataHitAreaLayerId(layerIdPrefix)}
        type="line"
        paint={{ ...missingDataHitAreaPaint, ...paint }}
        layout={layout}
      />
    </Source>
  )
}
