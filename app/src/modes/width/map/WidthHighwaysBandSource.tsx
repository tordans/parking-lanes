import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { WidthFeatureCollection } from './parse-highways'
import {
  buildBandPaint,
  sidepathBandPaint,
  sidepathHitAreaPaint,
  sidepathLineLayout,
  widthHitAreaPaint,
  widthLineLayout,
} from './width-layer-paint'

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

export function WidthHighwaysBandSource({
  features,
  selectedRef,
  focus,
}: {
  features: WidthFeatureCollection
  selectedRef: OsmFeatureRef | null
  focus: string
}) {
  const bandPaint = buildBandPaint(focus)
  const { highways, sidepaths, selectedHighways, selectedSidepaths } = splitFeatures(
    features,
    selectedRef,
  )

  return (
    <>
      {highways.features.length > 0 ? (
        <Source id="width-highways-source" type="geojson" data={highways}>
          <Layer
            id="width-highways-band-layer"
            type="line"
            paint={bandPaint}
            layout={widthLineLayout}
          />
          <Layer
            id="width-highways-hitarea-layer"
            type="line"
            paint={widthHitAreaPaint}
            layout={widthLineLayout}
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
            layout={widthLineLayout}
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
    </>
  )
}
