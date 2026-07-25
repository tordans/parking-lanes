import { Layer, Source } from 'react-map-gl/maplibre'
import { WAY_CUT_MARKERS_LAYER_PREFIX, WAY_CUT_PREVIEW_HITAREA_LAYER_ID } from './use-way-cut'
import {
  wayCutHitAreaCirclePaint,
  wayCutMarkerPaint,
  wayCutPreviewHitAreaPaint,
  wayCutPreviewPaint,
} from './way-cut-layer-paint'
import type { WayCutMarkerCollection } from './way-cut-store'

export function WayCutMarkersSource({ data }: { data: WayCutMarkerCollection }) {
  const sourceId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-source`
  const layerId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-layer`
  const hitAreaLayerId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-hitarea-layer`

  return (
    <Source id={sourceId} type="geojson" data={data}>
      <Layer
        id={layerId}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-marker']}
        paint={wayCutMarkerPaint}
      />
      <Layer
        id={`${layerId}-preview`}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-preview']}
        paint={wayCutPreviewPaint}
      />
      <Layer
        id={hitAreaLayerId}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-marker']}
        paint={wayCutHitAreaCirclePaint}
      />
      <Layer
        id={WAY_CUT_PREVIEW_HITAREA_LAYER_ID}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-preview']}
        paint={wayCutPreviewHitAreaPaint}
      />
    </Source>
  )
}
