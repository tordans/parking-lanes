import 'maplibre-gl/dist/maplibre-gl.css'
import { Layer, Map as MapGL, MapProvider, Source } from 'react-map-gl/maplibre'
import type { ParkingFeatureCollection } from './types'

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const laneLayerPaint = {
  'line-color': ['get', 'color'],
  'line-width': ['get', 'weight'],
  'line-offset': ['get', 'offset'],
} as Record<string, unknown>

const areaLayerPaint = {
  'fill-color': ['get', 'color'],
  'fill-opacity': 0.35,
  'fill-outline-color': ['get', 'color'],
} as Record<string, unknown>

const pointLayerPaint = {
  'circle-color': ['get', 'color'],
  'circle-radius': ['get', 'weight'],
  'circle-opacity': 0.6,
  'circle-stroke-width': 0,
} as Record<string, unknown>

const backlightPaint = {
  'line-color': ['get', 'color'],
  'line-width': ['get', 'weight'],
  'line-offset': ['get', 'offset'],
  'line-opacity': 0.4,
} as Record<string, unknown>

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
    return (
      <Source id={sourceId} type="geojson" data={collection}>
        <Layer id={layerId} type="circle" paint={pointLayerPaint} />
      </Source>
    )
  }

  return (
    <Source id={sourceId} type="geojson" data={collection}>
      <Layer
        id={layerId}
        type="line"
        paint={layerType === 'backlight' ? backlightPaint : laneLayerPaint}
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
      />
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

export { MapGL, MapProvider, OPENFREEMAP_STYLE }
