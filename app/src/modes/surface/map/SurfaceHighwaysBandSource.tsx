import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { Layer, Source } from 'react-map-gl/maplibre'
import { SIDEPATH_LINE_OFFSET } from '../../../shell/map/map-hit-paint'
import {
  MissingDataCenterlineSource,
  missingDataHitAreaLayerId,
} from '../../../shell/map/MissingDataCenterlineSource'
import { SelectedWayCenterlineSource } from '../../../shell/map/SelectedWayCenterlineSource'
import type { SurfaceFeatureCollection } from './parse-highways'
import {
  buildSurfaceBandPaint,
  buildSurfaceDottedOverlayPaint,
  sidepathCenterlinePaint,
  sidepathHitAreaPaint,
  sidepathLineLayout,
  surfaceDottedOverlayFilter,
  surfaceHitAreaPaint,
  surfaceLineLayout,
} from './surface-layer-paint'

export const surfaceMissingLayerIdPrefix = 'surface-missing'
export const surfaceMissingHitAreaLayerId = missingDataHitAreaLayerId(surfaceMissingLayerIdPrefix)
export const surfaceMissingSidepathsLayerIdPrefix = 'surface-missing-sidepaths'
export const surfaceMissingSidepathsHitAreaLayerId = missingDataHitAreaLayerId(
  surfaceMissingSidepathsLayerIdPrefix,
)

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
  const missingHighways: SurfaceFeatureCollection = { type: 'FeatureCollection', features: [] }
  const missingSidepaths: SurfaceFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selected: SurfaceFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    // Omit the selection so smoothness colors do not paint over the black centerline.
    if (matchesSelection(feature.properties, selectedRef)) {
      selected.features.push(feature)
      continue
    }

    if (feature.properties.missingSurface) {
      if (feature.properties.kind === 'sidepath') {
        missingSidepaths.features.push(feature)
      } else {
        missingHighways.features.push(feature)
      }
      continue
    }

    if (feature.properties.kind === 'sidepath') {
      sidepaths.features.push(feature)
      continue
    }

    highways.features.push(feature)
  }

  return { highways, sidepaths, missingHighways, missingSidepaths, selected }
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
  const hasSelection = selectedRef != null
  const bandPaint = buildSurfaceBandPaint(focus, hasSelection)
  const sidepathBandPaint = buildSurfaceBandPaint(focus, hasSelection, true)
  const dottedOverlayPaint = buildSurfaceDottedOverlayPaint(hasSelection)
  const sidepathDottedOverlayPaint = buildSurfaceDottedOverlayPaint(hasSelection, true)
  const { highways, sidepaths, missingHighways, missingSidepaths, selected } = splitFeatures(
    features,
    selectedRef,
  )
  const selectedIsSidepath = selected.features[0]?.properties.kind === 'sidepath'

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
            paint={dottedOverlayPaint}
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

      <MissingDataCenterlineSource
        sourceId="surface-missing-source"
        layerIdPrefix={surfaceMissingLayerIdPrefix}
        collection={missingHighways}
        layout={surfaceLineLayout}
      />

      {sidepaths.features.length > 0 ? (
        <Source id="surface-sidepaths-source" type="geojson" data={sidepaths}>
          <Layer
            id="surface-sidepaths-band-layer"
            type="line"
            paint={sidepathBandPaint}
            layout={sidepathLineLayout}
          />
          <Layer
            id="surface-sidepaths-dotted-layer"
            type="line"
            paint={sidepathDottedOverlayPaint}
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

      <MissingDataCenterlineSource
        sourceId="surface-missing-sidepaths-source"
        layerIdPrefix={surfaceMissingSidepathsLayerIdPrefix}
        collection={missingSidepaths}
        layout={sidepathLineLayout}
        paint={{ 'line-offset': SIDEPATH_LINE_OFFSET }}
      />

      <SelectedWayCenterlineSource
        sourceId="surface-selected-centerline-source"
        layerId="surface-selected-centerline-layer"
        collection={selected}
        layout={surfaceLineLayout}
        paint={selectedIsSidepath ? sidepathCenterlinePaint : undefined}
      />
    </>
  )
}
