import { Layer, Source } from 'react-map-gl/maplibre'
import { WAY_CUT_MARKERS_LAYER_PREFIX } from './use-way-cut'
import { useWayCutMarkers } from './way-cut-store'

const pointLayerPaint = {
  'circle-color': ['get', 'color'],
  'circle-radius': ['coalesce', ['get', 'weight'], 4],
  'circle-opacity': 0.85,
  'circle-stroke-width': 1,
  'circle-stroke-color': '#854d0e',
} as Record<string, unknown>

const hitAreaCirclePaint = {
  'circle-color': '#000',
  'circle-opacity': 0,
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 12, 14, 14, 22, 16],
  'circle-stroke-width': 0,
} as Record<string, unknown>

export function WayCutLayers() {
  const cutMarkers = useWayCutMarkers()
  if (cutMarkers.features.length === 0) return null

  const sourceId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-source`
  const layerId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-layer`
  const hitAreaLayerId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-hitarea-layer`

  return (
    <Source id={sourceId} type="geojson" data={cutMarkers}>
      <Layer id={layerId} type="circle" paint={pointLayerPaint} />
      <Layer id={hitAreaLayerId} type="circle" paint={hitAreaCirclePaint} />
    </Source>
  )
}
