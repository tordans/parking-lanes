import { Layer, Source } from 'react-map-gl/maplibre'
import type { HandleGeometry } from '../domain/handle-geometry'
import { lineWidthFromMeters, selectedCenterlineWidth } from '../domain/meters-to-pixels'
import type { WidthHighwayCollection } from './parse-highways'

const lineLayout = { 'line-cap': 'round', 'line-join': 'round' } as const

const bandPaint = {
  'line-color': '#94a3b8',
  'line-opacity': 0.45,
  'line-width': lineWidthFromMeters('roadWidthM'),
} as Record<string, unknown>

const hitAreaPaint = {
  'line-color': '#000',
  'line-opacity': 0,
  'line-width': ['+', lineWidthFromMeters('roadWidthM'), 8],
} as Record<string, unknown>

const selectedCenterlinePaint = {
  'line-color': '#1d4ed8',
  'line-width': selectedCenterlineWidth,
} as Record<string, unknown>

const handleFillPaint = {
  'fill-color': '#3b82f6',
  'fill-opacity': 0.08,
} as Record<string, unknown>

const handleStrokePaint = {
  'line-color': '#1d4ed8',
  'line-width': 1,
  'line-opacity': 0.9,
} as Record<string, unknown>

const handleCuePaint = {
  'circle-color': '#1d4ed8',
  'circle-radius': 3,
  'circle-stroke-width': 1,
  'circle-stroke-color': '#ffffff',
} as Record<string, unknown>

const handleHitAreaPaint = {
  'line-color': '#000',
  'line-opacity': 0,
  'line-width': 14,
} as Record<string, unknown>

type Props = {
  highways: WidthHighwayCollection
  selectedOsmId: number | null
  selectedCenterline: WidthHighwayCollection
  handles: HandleGeometry | null
}

export function WidthLayers({ highways, selectedOsmId, selectedCenterline, handles }: Props) {
  const unselectedHighways: WidthHighwayCollection = selectedOsmId
    ? {
        type: 'FeatureCollection',
        features: highways.features.filter((f) => f.properties.osmId !== selectedOsmId),
      }
    : highways

  return (
    <>
      {unselectedHighways.features.length > 0 ? (
        <Source id="width-highways-source" type="geojson" data={unselectedHighways}>
          <Layer id="width-highways-band-layer" type="line" paint={bandPaint} layout={lineLayout} />
          <Layer
            id="width-highways-hitarea-layer"
            type="line"
            paint={hitAreaPaint}
            layout={lineLayout}
          />
        </Source>
      ) : null}

      {selectedCenterline.features.length > 0 ? (
        <Source id="width-selected-centerline-source" type="geojson" data={selectedCenterline}>
          <Layer
            id="width-selected-centerline-layer"
            type="line"
            paint={selectedCenterlinePaint}
            layout={lineLayout}
          />
        </Source>
      ) : null}

      {handles ? (
        <>
          <Source id="width-handles-fill-source" type="geojson" data={handles.rectangles}>
            <Layer id="width-handles-fill-layer" type="fill" paint={handleFillPaint} />
          </Source>
          <Source id="width-handles-stroke-source" type="geojson" data={handles.strokes}>
            <Layer
              id="width-handles-stroke-layer"
              type="line"
              paint={handleStrokePaint}
              layout={lineLayout}
            />
          </Source>
          <Source id="width-handles-cues-source" type="geojson" data={handles.cues}>
            <Layer id="width-handles-cues-layer" type="circle" paint={handleCuePaint} />
          </Source>
          <Source id="width-handles-hitarea-source" type="geojson" data={handles.hitAreas}>
            <Layer
              id="width-handles-hitarea-layer"
              type="line"
              paint={handleHitAreaPaint}
              layout={lineLayout}
            />
          </Source>
        </>
      ) : null}
    </>
  )
}

export const widthInteractiveLayerIds = [
  'width-highways-hitarea-layer',
  'width-handles-hitarea-layer',
]
