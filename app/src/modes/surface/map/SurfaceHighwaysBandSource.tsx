import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { SurfaceFeatureCollection } from './parse-highways'
import {
  buildSurfaceBandPaint,
  selectedCenterlinePaint,
  sidepathHitAreaPaint,
  sidepathLineLayout,
  surfaceDottedOverlayFilter,
  surfaceDottedOverlayPaint,
  surfaceHitAreaPaint,
  surfaceLineLayout,
} from './surface-layer-paint'

function matchesSelection(
  properties: SurfaceFeatureCollection['features'][number]['properties'],
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

function splitFeatures(features: SurfaceFeatureCollection, selectedRef: OsmFeatureRef | null) {
  const highways: SurfaceFeatureCollection = { type: 'FeatureCollection', features: [] }
  const sidepaths: SurfaceFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selectedHighways: SurfaceFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selectedSidepaths: SurfaceFeatureCollection = { type: 'FeatureCollection', features: [] }

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

export function SurfaceHighwaysBandSource({
  features,
  selectedRef,
  focus,
}: {
  features: SurfaceFeatureCollection
  selectedRef: OsmFeatureRef | null
  focus: string
}) {
  const bandPaint = buildSurfaceBandPaint(focus)
  const { highways, sidepaths, selectedHighways, selectedSidepaths } = splitFeatures(
    features,
    selectedRef,
  )

  return (
    <>
      {highways.features.length > 0 ? (
        <Source id="surface-highways-source" type="geojson" data={highways}>
          <Layer
            id="surface-highways-band-layer"
            type="line"
            paint={bandPaint}
            layout={surfaceLineLayout}
          />
          <Layer
            id="surface-highways-dotted-layer"
            type="line"
            paint={surfaceDottedOverlayPaint}
            layout={surfaceLineLayout}
            filter={surfaceDottedOverlayFilter}
          />
          <Layer
            id="surface-highways-hitarea-layer"
            type="line"
            paint={surfaceHitAreaPaint}
            layout={surfaceLineLayout}
          />
        </Source>
      ) : null}

      {sidepaths.features.length > 0 ? (
        <Source id="surface-sidepaths-source" type="geojson" data={sidepaths}>
          <Layer
            id="surface-sidepaths-band-layer"
            type="line"
            paint={bandPaint}
            layout={sidepathLineLayout}
          />
          <Layer
            id="surface-sidepaths-dotted-layer"
            type="line"
            paint={surfaceDottedOverlayPaint}
            layout={sidepathLineLayout}
            filter={surfaceDottedOverlayFilter}
          />
          <Layer
            id="surface-sidepaths-hitarea-layer"
            type="line"
            paint={sidepathHitAreaPaint}
            layout={sidepathLineLayout}
          />
        </Source>
      ) : null}

      {selectedHighways.features.length > 0 ? (
        <Source id="surface-selected-highways-source" type="geojson" data={selectedHighways}>
          <Layer
            id="surface-selected-highways-band-layer"
            type="line"
            paint={bandPaint}
            layout={surfaceLineLayout}
          />
          <Layer
            id="surface-selected-highways-dotted-layer"
            type="line"
            paint={surfaceDottedOverlayPaint}
            layout={surfaceLineLayout}
            filter={surfaceDottedOverlayFilter}
          />
          <Layer
            id="surface-selected-highways-centerline-layer"
            type="line"
            paint={selectedCenterlinePaint}
            layout={surfaceLineLayout}
          />
        </Source>
      ) : null}

      {selectedSidepaths.features.length > 0 ? (
        <Source id="surface-selected-sidepaths-source" type="geojson" data={selectedSidepaths}>
          <Layer
            id="surface-selected-sidepaths-band-layer"
            type="line"
            paint={bandPaint}
            layout={sidepathLineLayout}
          />
          <Layer
            id="surface-selected-sidepaths-dotted-layer"
            type="line"
            paint={surfaceDottedOverlayPaint}
            layout={sidepathLineLayout}
            filter={surfaceDottedOverlayFilter}
          />
          <Layer
            id="surface-selected-sidepaths-centerline-layer"
            type="line"
            paint={selectedCenterlinePaint}
            layout={sidepathLineLayout}
          />
        </Source>
      ) : null}
    </>
  )
}
