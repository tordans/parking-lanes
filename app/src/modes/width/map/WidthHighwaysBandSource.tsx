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

function splitFeatures(features: WidthFeatureCollection) {
  const highways: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }
  const sidepaths: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }
  const missingHighways: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }
  const missingSidepaths: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    const isMissing = feature.properties.widthKind === 'default'
    // Keep the selected way's width band (and missing dots) under the black centerline /
    // orange handles — omitting it made high-zoom selection look like empty map data.

    if (feature.properties.kind === 'sidepath') {
      sidepaths.features.push(feature)
      if (isMissing) missingSidepaths.features.push(feature)
      continue
    }

    highways.features.push(feature)
    if (isMissing) missingHighways.features.push(feature)
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
  const { highways, sidepaths, missingHighways, missingSidepaths } = splitFeatures(features)

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
