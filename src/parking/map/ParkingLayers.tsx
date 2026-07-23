import 'maplibre-gl/dist/maplibre-gl.css'
import { Layer, Map as MapGL, MapProvider, Source } from 'react-map-gl/maplibre'
import { OPENFREEMAP_POSITRON_STYLE_URL } from '../../utils/openfreemap-style'
import type { ParkingFeatureCollection } from './types'

const laneLayerPaint = {
  'line-color': ['get', 'color'],
  'line-width': ['coalesce', ['get', 'weight'], 2],
  'line-offset': ['coalesce', ['get', 'offset'], 0],
} as Record<string, unknown>

/** Extra px beyond painted lane span for forgiving hover/click. */
const HIT_AREA_PADDING = 3

const hitAreaLinePaint = {
  'line-color': '#000',
  'line-opacity': 0,
  // Centerline hit strip: 2×|offset| spans left+right strips, +weight for line thickness, +padding.
  'line-width': [
    '+',
    ['*', 2, ['abs', ['coalesce', ['get', 'offset'], 0]]],
    ['coalesce', ['get', 'weight'], 2],
    HIT_AREA_PADDING,
  ],
} as Record<string, unknown>

const areaLayerPaint = {
  'fill-color': ['get', 'color'],
  'fill-opacity': 0.35,
  'fill-outline-color': ['get', 'color'],
} as Record<string, unknown>

const pointLayerPaint = {
  'circle-color': ['get', 'color'],
  'circle-radius': ['coalesce', ['get', 'weight'], 4],
  'circle-opacity': 0.6,
  'circle-stroke-width': 0,
} as Record<string, unknown>

const hitAreaCirclePaint = {
  'circle-color': '#000',
  'circle-opacity': 0,
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 12, 14, 14, 22, 16],
  'circle-stroke-width': 0,
} as Record<string, unknown>

const backlightPaint = {
  'line-color': ['get', 'color'],
  'line-width': ['coalesce', ['get', 'weight'], 2],
  'line-offset': ['coalesce', ['get', 'offset'], 0],
  'line-opacity': 0.4,
} as Record<string, unknown>

const lineLayout = { 'line-cap': 'round', 'line-join': 'round' } as const

function FeatureLayers({
  id,
  collection,
  layerType,
}: {
  id: string
  collection: ParkingFeatureCollection
  layerType: 'lane' | 'area' | 'point' | 'backlight' | 'cut'
}) {
  if (!collection.features.length) return null

  const sourceId = `${id}-source`
  const layerId = `${id}-layer`

  if (layerType === 'area') {
    return (
      <Source id={sourceId} type="geojson" data={collection}>
        <Layer id={layerId} type="fill" paint={areaLayerPaint} />
      </Source>
    )
  }

  if (layerType === 'point' || layerType === 'cut') {
    const hitAreaLayerId = `${id}-hitarea-layer`
    return (
      <Source id={sourceId} type="geojson" data={collection}>
        <Layer id={layerId} type="circle" paint={pointLayerPaint} />
        <Layer id={hitAreaLayerId} type="circle" paint={hitAreaCirclePaint} />
      </Source>
    )
  }

  if (layerType === 'lane') {
    const hitAreaLayerId = `${id}-hitarea-layer`
    return (
      <Source id={sourceId} type="geojson" data={collection}>
        <Layer id={layerId} type="line" paint={laneLayerPaint} layout={lineLayout} />
        <Layer id={hitAreaLayerId} type="line" paint={hitAreaLinePaint} layout={lineLayout} />
      </Source>
    )
  }

  return (
    <Source id={sourceId} type="geojson" data={collection}>
      <Layer id={layerId} type="line" paint={backlightPaint} layout={lineLayout} />
    </Source>
  )
}

export function ParkingLayers({
  lanes,
  areas,
  points,
  backlights,
  cutMarkers,
}: {
  lanes: ParkingFeatureCollection
  areas: ParkingFeatureCollection
  points: ParkingFeatureCollection
  backlights: ParkingFeatureCollection
  cutMarkers: ParkingFeatureCollection
}) {
  return (
    <>
      <FeatureLayers id="parking-areas" collection={areas} layerType="area" />
      <FeatureLayers id="parking-lanes" collection={lanes} layerType="lane" />
      <FeatureLayers id="parking-points" collection={points} layerType="point" />
      <FeatureLayers id="parking-backlights" collection={backlights} layerType="backlight" />
      <FeatureLayers id="parking-cut-markers" collection={cutMarkers} layerType="cut" />
    </>
  )
}

export { MapGL, MapProvider, OPENFREEMAP_POSITRON_STYLE_URL as MAP_STYLE }
