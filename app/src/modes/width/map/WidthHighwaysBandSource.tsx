import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { Layer, Source } from 'react-map-gl/maplibre'
import { SIDEPATH_LINE_OFFSET } from '../../../shell/map/map-hit-paint'
import { missingDataDottedOverlayPaint } from '../../../shell/map/missing-data-paint'
import type { WidthFeatureCollection } from './parse-highways'
import {
  buildBandPaint,
  buildSidepathBandPaint,
  sidepathHitAreaPaint,
  sidepathLineLayout,
  widthHitAreaPaint,
  widthLineLayout,
} from './width-layer-paint'

/** True when the selection is a car carriageway (not a sidepath / ped / bike way). */
function isCarHighwaySelection(
  features: WidthFeatureCollection,
  selectedRef: OsmFeatureRef | null,
): boolean {
  if (!selectedRef || selectedRef.type !== 'way') return false
  if (selectedRef.prefix != null || selectedRef.side != null) return false

  const selected = features.features.find(
    (feature) =>
      feature.properties.kind === 'highway' && feature.properties.osmId === selectedRef.id,
  )
  return selected?.properties.kind === 'highway' && selected.properties.infra === 'car'
}

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
  const missingHighways: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }
  const missingSidepaths: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    const isMissing = feature.properties.widthKind === 'default'
    // Keep the selected width band for hit-testing / handles; drop pink missing chrome under
    // the black hairline (same as parking/surface/bicycle).
    const showMissing = isMissing && !matchesSelection(feature.properties, selectedRef)

    if (feature.properties.kind === 'sidepath') {
      sidepaths.features.push(feature)
      if (showMissing) missingSidepaths.features.push(feature)
      continue
    }

    highways.features.push(feature)
    if (showMissing) missingHighways.features.push(feature)
  }

  return { highways, sidepaths, missingHighways, missingSidepaths }
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
  const dimNonCar = isCarHighwaySelection(features, selectedRef)
  const bandPaint = buildBandPaint(focus, dimNonCar)
  const sidepathBandPaint = buildSidepathBandPaint(dimNonCar)
  const { highways, sidepaths, missingHighways, missingSidepaths } = splitFeatures(
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

      {missingHighways.features.length > 0 ? (
        <Source id="width-missing-highways-source" type="geojson" data={missingHighways}>
          <Layer
            id="width-missing-highways-dotted-layer"
            type="line"
            paint={missingDataDottedOverlayPaint}
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

      {missingSidepaths.features.length > 0 ? (
        <Source id="width-missing-sidepaths-source" type="geojson" data={missingSidepaths}>
          <Layer
            id="width-missing-sidepaths-dotted-layer"
            type="line"
            paint={
              {
                ...missingDataDottedOverlayPaint,
                'line-offset': SIDEPATH_LINE_OFFSET,
              } as Record<string, unknown>
            }
            layout={sidepathLineLayout}
          />
        </Source>
      ) : null}
    </>
  )
}
