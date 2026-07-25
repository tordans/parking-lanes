import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { focusCaseColor, focusCaseOpacity } from '../../../shell/map/map-focus-paint'
import { useMapFocus } from '../../../shell/map/use-map-focus'
import type { HandleGeometry } from '../domain/handle-geometry'
import {
  lineOffsetFromMeters,
  lineWidthFromMeters,
  selectedCenterlineWidth,
} from '../domain/meters-to-pixels'
import type { WidthFeatureCollection } from './parse-highways'
import { WIDTH_KIND_COLORS } from './width-colors'

const lineLayout = { 'line-cap': 'round', 'line-join': 'round' } as const

const bandActiveOpacity = 0.55

const widthKindColor = [
  'match',
  ['get', 'widthKind'],
  'explicit',
  WIDTH_KIND_COLORS.explicit,
  'default',
  WIDTH_KIND_COLORS.default,
  WIDTH_KIND_COLORS.default,
] as const

function buildBandPaint(focus: string) {
  if (focus === 'all') {
    return {
      'line-color': widthKindColor,
      'line-opacity': bandActiveOpacity,
      'line-width': lineWidthFromMeters('roadWidthM'),
    } as Record<string, unknown>
  }

  const matchExpr = ['==', ['get', 'infra'], focus]

  return {
    'line-color': focusCaseColor(matchExpr, widthKindColor),
    'line-opacity': focusCaseOpacity(matchExpr, bandActiveOpacity),
    'line-width': lineWidthFromMeters('roadWidthM'),
  } as Record<string, unknown>
}

const sidepathBandPaint = {
  'line-color': widthKindColor,
  'line-opacity': bandActiveOpacity,
  'line-width': lineWidthFromMeters('roadWidthM'),
} as Record<string, unknown>

const sidepathLineLayout = {
  ...lineLayout,
  'line-offset': [
    '*',
    ['case', ['==', ['get', 'side'], 'left'], 1, -1],
    lineOffsetFromMeters('parentRoadWidthM', 0.5),
  ],
} as const

const hitAreaPaint = {
  'line-color': '#000',
  'line-opacity': 0,
  'line-width': lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
} as Record<string, unknown>

const sidepathHitAreaPaint = {
  'line-color': '#000',
  'line-opacity': 0,
  'line-width': lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
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

function matchesSelection(
  properties: WidthFeatureCollection['features'][number]['properties'],
  selectedRef: OsmFeatureRef | null,
) {
  if (!selectedRef || selectedRef.type !== 'way' || selectedRef.id !== properties.osmId) {
    return false
  }

  if (properties.kind === 'sidepath') {
    return selectedRef.prefix === properties.prefix && selectedRef.side === properties.side
  }

  return selectedRef.prefix == null && selectedRef.side == null
}

function splitFeatures(features: WidthFeatureCollection, selectedRef: OsmFeatureRef | null) {
  const highways: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }
  const sidepaths: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selectedHighways: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selectedSidepaths: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    const selected = matchesSelection(feature.properties, selectedRef)
    if (feature.properties.kind === 'sidepath') {
      if (selected) selectedSidepaths.features.push(feature)
      else sidepaths.features.push(feature)
      continue
    }

    if (selected) selectedHighways.features.push(feature)
    else highways.features.push(feature)
  }

  return { highways, sidepaths, selectedHighways, selectedSidepaths }
}

type Props = {
  features: WidthFeatureCollection
  selectedRef: OsmFeatureRef | null
  selectedCenterline: WidthFeatureCollection
  handles: HandleGeometry | null
}

export function WidthLayers({ features, selectedRef, selectedCenterline, handles }: Props) {
  const { focus } = useMapFocus()
  const bandPaint = useMemo(() => buildBandPaint(focus), [focus])
  const { highways, sidepaths, selectedHighways, selectedSidepaths } = useMemo(
    () => splitFeatures(features, selectedRef),
    [features, selectedRef],
  )

  return (
    <>
      {highways.features.length > 0 ? (
        <Source id="width-highways-source" type="geojson" data={highways}>
          <Layer id="width-highways-band-layer" type="line" paint={bandPaint} layout={lineLayout} />
          <Layer
            id="width-highways-hitarea-layer"
            type="line"
            paint={hitAreaPaint}
            layout={lineLayout}
          />
        </Source>
      ) : null}

      {sidepaths.features.length > 0 ? (
        <Source id="width-sidepaths-source" type="geojson" data={sidepaths}>
          <Layer
            id="width-sidepaths-band-layer"
            type="line"
            paint={sidepathBandPaint}
            layout={sidepathLineLayout}
          />
          <Layer
            id="width-sidepaths-hitarea-layer"
            type="line"
            paint={sidepathHitAreaPaint}
            layout={sidepathLineLayout}
          />
        </Source>
      ) : null}

      {selectedHighways.features.length > 0 ? (
        <Source id="width-selected-highways-source" type="geojson" data={selectedHighways}>
          <Layer
            id="width-selected-highways-band-layer"
            type="line"
            paint={bandPaint}
            layout={lineLayout}
          />
        </Source>
      ) : null}

      {selectedSidepaths.features.length > 0 ? (
        <Source id="width-selected-sidepaths-source" type="geojson" data={selectedSidepaths}>
          <Layer
            id="width-selected-sidepaths-band-layer"
            type="line"
            paint={sidepathBandPaint}
            layout={sidepathLineLayout}
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
  'width-sidepaths-hitarea-layer',
  'width-handles-hitarea-layer',
]
