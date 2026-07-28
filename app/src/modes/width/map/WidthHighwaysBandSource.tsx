import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { Layer, Source } from 'react-map-gl/maplibre'
import { SIDEPATH_LINE_OFFSET } from '../../../shell/map/map-hit-paint'
import { missingDataCenterlinePaint } from '../../../shell/map/missing-data-paint'
import type { WidthFeatureCollection } from './parse-highways'
import {
  buildBandPaint,
  buildSidepathBandPaint,
  selectedWidthHitAreaPaint,
  selectedWidthSidepathHitAreaPaint,
  sidepathLineLayout,
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
  const selectedHit: WidthFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    const isSelected = matchesSelection(feature.properties, selectedRef)
    const isMissing = feature.properties.widthKind === 'default'
    // No pink missing chrome under the black hairline when selected.
    const showMissing = isMissing && !isSelected

    if (isSelected) {
      selectedHit.features.push(feature)
    }

    if (feature.properties.kind === 'sidepath') {
      // Omit selected from the visible band so no pink/teal width shows under the hairline.
      if (!isSelected) sidepaths.features.push(feature)
      if (showMissing) missingSidepaths.features.push(feature)
      continue
    }

    if (!isSelected) highways.features.push(feature)
    if (showMissing) missingHighways.features.push(feature)
  }

  return { highways, sidepaths, missingHighways, missingSidepaths, selectedHit }
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
  const { highways, sidepaths, missingHighways, missingSidepaths, selectedHit } = splitFeatures(
    features,
    selectedRef,
  )
  const selectedIsSidepath = selectedHit.features[0]?.properties.kind === 'sidepath'

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
        </Source>
      ) : null}

      {missingHighways.features.length > 0 ? (
        <Source id="width-missing-highways-source" type="geojson" data={missingHighways}>
          <Layer
            id="width-missing-highways-layer"
            type="line"
            paint={missingDataCenterlinePaint}
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
        </Source>
      ) : null}

      {missingSidepaths.features.length > 0 ? (
        <Source id="width-missing-sidepaths-source" type="geojson" data={missingSidepaths}>
          <Layer
            id="width-missing-sidepaths-layer"
            type="line"
            paint={
              {
                ...missingDataCenterlinePaint,
                'line-offset': SIDEPATH_LINE_OFFSET,
              } as Record<string, unknown>
            }
            layout={sidepathLineLayout}
          />
        </Source>
      ) : null}

      {selectedHit.features.length > 0 ? (
        <Source id="width-selected-hit-source" type="geojson" data={selectedHit}>
          <Layer
            id="width-selected-hit-layer"
            type="line"
            paint={
              selectedIsSidepath ? selectedWidthSidepathHitAreaPaint : selectedWidthHitAreaPaint
            }
            layout={selectedIsSidepath ? sidepathLineLayout : widthLineLayout}
          />
        </Source>
      ) : null}
    </>
  )
}
