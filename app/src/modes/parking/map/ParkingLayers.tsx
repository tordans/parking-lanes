import { useMemo } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layer, Source } from 'react-map-gl/maplibre'
import { focusCaseColor, focusCaseOpacity } from '../../../shell/map/map-focus-paint'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import type { ParkingFeatureCollection } from './types'

const laneActiveOpacity = 1
const areaActiveOpacity = 0.35
const pointActiveOpacity = 0.6
const backlightActiveOpacity = 0.4

const missingSurfaceMatch = ['==', ['get', 'missingSurface'], 1]

function buildLanePaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'line-color': color,
      'line-width': ['coalesce', ['get', 'weight'], 2],
      'line-offset': ['coalesce', ['get', 'offset'], 0],
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(missingSurfaceMatch, color),
    'line-opacity': focusCaseOpacity(missingSurfaceMatch, laneActiveOpacity),
    'line-width': ['coalesce', ['get', 'weight'], 2],
    'line-offset': ['coalesce', ['get', 'offset'], 0],
  } as Record<string, unknown>
}

function buildAreaPaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'fill-color': color,
      'fill-opacity': areaActiveOpacity,
      'fill-outline-color': color,
    } as Record<string, unknown>
  }

  return {
    'fill-color': focusCaseColor(missingSurfaceMatch, color),
    'fill-opacity': focusCaseOpacity(missingSurfaceMatch, areaActiveOpacity),
    'fill-outline-color': focusCaseColor(missingSurfaceMatch, color),
  } as Record<string, unknown>
}

function buildPointPaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'circle-color': color,
      'circle-radius': ['coalesce', ['get', 'weight'], 4],
      'circle-opacity': pointActiveOpacity,
      'circle-stroke-width': 0,
    } as Record<string, unknown>
  }

  return {
    'circle-color': focusCaseColor(missingSurfaceMatch, color),
    'circle-radius': ['coalesce', ['get', 'weight'], 4],
    'circle-opacity': focusCaseOpacity(missingSurfaceMatch, pointActiveOpacity),
    'circle-stroke-width': 0,
  } as Record<string, unknown>
}

function buildBacklightPaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'line-color': color,
      'line-width': ['coalesce', ['get', 'weight'], 2],
      'line-offset': ['coalesce', ['get', 'offset'], 0],
      'line-opacity': backlightActiveOpacity,
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(missingSurfaceMatch, color),
    'line-width': ['coalesce', ['get', 'weight'], 2],
    'line-offset': ['coalesce', ['get', 'offset'], 0],
    'line-opacity': focusCaseOpacity(missingSurfaceMatch, backlightActiveOpacity),
  } as Record<string, unknown>
}

/** Extra px beyond painted lane span for forgiving hover/click. */
const HIT_AREA_PADDING = 3

const hitAreaLinePaint = {
  'line-color': '#000',
  'line-opacity': 0,
  'line-width': [
    '+',
    ['*', 2, ['abs', ['coalesce', ['get', 'offset'], 0]]],
    ['coalesce', ['get', 'weight'], 2],
    HIT_AREA_PADDING,
  ],
} as Record<string, unknown>

const hitAreaCirclePaint = {
  'circle-color': '#000',
  'circle-opacity': 0,
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 12, 14, 14, 22, 16],
  'circle-stroke-width': 0,
} as Record<string, unknown>

const lineLayout = { 'line-cap': 'round', 'line-join': 'round' } as const

function FeatureLayers({
  id,
  collection,
  layerType,
  focus,
}: {
  id: string
  collection: ParkingFeatureCollection
  layerType: 'lane' | 'area' | 'point' | 'backlight'
  focus: string
}) {
  if (!collection.features.length) return null

  const sourceId = `${id}-source`
  const layerId = `${id}-layer`

  if (layerType === 'area') {
    const paint = buildAreaPaint(focus)
    return (
      <Source id={sourceId} type="geojson" data={collection}>
        <Layer id={layerId} type="fill" paint={paint} />
      </Source>
    )
  }

  if (layerType === 'point') {
    const paint = buildPointPaint(focus)
    const hitAreaLayerId = `${id}-hitarea-layer`
    return (
      <Source id={sourceId} type="geojson" data={collection}>
        <Layer id={layerId} type="circle" paint={paint} />
        <Layer id={hitAreaLayerId} type="circle" paint={hitAreaCirclePaint} />
      </Source>
    )
  }

  if (layerType === 'lane') {
    const paint = buildLanePaint(focus)
    const hitAreaLayerId = `${id}-hitarea-layer`
    return (
      <Source id={sourceId} type="geojson" data={collection}>
        <Layer id={layerId} type="line" paint={paint} layout={lineLayout} />
        <Layer id={hitAreaLayerId} type="line" paint={hitAreaLinePaint} layout={lineLayout} />
      </Source>
    )
  }

  const paint = buildBacklightPaint(focus)
  return (
    <Source id={sourceId} type="geojson" data={collection}>
      <Layer id={layerId} type="line" paint={paint} layout={lineLayout} />
    </Source>
  )
}

export function ParkingLayers({
  lanes,
  areas,
  points,
  backlights,
}: {
  lanes: ParkingFeatureCollection
  areas: ParkingFeatureCollection
  points: ParkingFeatureCollection
  backlights: ParkingFeatureCollection
}) {
  const { focus } = useMapFocus()
  const parkingFocus = useMemo(() => (focus === 'noSurface' ? 'noSurface' : 'all'), [focus])

  return (
    <>
      <FeatureLayers id="parking-areas" collection={areas} layerType="area" focus={parkingFocus} />
      <FeatureLayers id="parking-lanes" collection={lanes} layerType="lane" focus={parkingFocus} />
      <FeatureLayers
        id="parking-points"
        collection={points}
        layerType="point"
        focus={parkingFocus}
      />
      <FeatureLayers
        id="parking-backlights"
        collection={backlights}
        layerType="backlight"
        focus={parkingFocus}
      />
    </>
  )
}
