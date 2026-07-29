import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { Layer, Source } from 'react-map-gl/maplibre'
import {
  MissingDataCenterlineSource,
  missingDataHitAreaLayerId,
} from '../../../shell/map/MissingDataCenterlineSource'
import {
  bicycleHitAreaPaint,
  bicycleLineLayout,
  buildBicycleBandPaint,
  centerlinePresencePaint,
  selectedBicycleHitAreaPaint,
  selectedBicycleSidepathHitAreaPaint,
  sidepathBandPaint,
  sidepathHitAreaPaint,
  sidepathLineLayout,
} from './bicycle-layer-paint'
import type { BicycleFeatureCollection } from './parse-bikelanes'

export const bicycleMissingLayerIdPrefix = 'bicycle-missing'
export const bicycleMissingHitAreaLayerId = missingDataHitAreaLayerId(bicycleMissingLayerIdPrefix)
export const bicycleSelectedHitAreaLayerId = 'bicycle-selected-hitarea-layer'

function isParentCenterlineOnly(
  properties: BicycleFeatureCollection['features'][number]['properties'],
) {
  return properties.kind === 'highway' && properties.category === 'parentCenterline'
}

function isMissingBicycleFeature(
  properties: BicycleFeatureCollection['features'][number]['properties'],
) {
  if (isParentCenterlineOnly(properties)) return false
  return properties.paintState === 'noInfra' || properties.category === 'unknown'
}

function matchesSelection(
  properties: BicycleFeatureCollection['features'][number]['properties'],
  selectedRef: OsmFeatureRef | null,
) {
  if (!selectedRef || selectedRef.type !== 'way' || selectedRef.id !== properties.osmId) {
    return false
  }

  // Parent centerline selection (`f=way/id`) hides every painted piece of that way.
  if (selectedRef.prefix == null && selectedRef.side == null) {
    return true
  }

  if (properties.kind === 'sidepath') {
    return selectedRef.prefix === properties.prefix && selectedRef.side === properties.side
  }

  return false
}

function splitFeatures(
  features: BicycleFeatureCollection,
  selectedRef: OsmFeatureRef | null,
  focus: string,
) {
  const highways: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }
  const sidepaths: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }
  const missing: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }
  const centerlinePresence: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }
  const parentHits: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selectedHit: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    const isSelected = matchesSelection(feature.properties, selectedRef)
    if (isSelected) {
      // Hit target is only the canonical selection (parent centerline or one sidepath),
      // not every sibling piece hidden for paint.
      if (selectedRef?.prefix == null && selectedRef?.side == null) {
        if (feature.properties.kind === 'highway') selectedHit.features.push(feature)
      } else if (feature.properties.kind === 'sidepath') {
        selectedHit.features.push(feature)
      }
      continue
    }

    // Hit-only parent centerline when sides carry the painted bands.
    if (isParentCenterlineOnly(feature.properties)) {
      parentHits.features.push(feature)
      continue
    }

    if (isMissingBicycleFeature(feature.properties)) {
      if (focus === 'incomplete' && !feature.properties.incomplete) continue
      missing.features.push(feature)
      continue
    }

    if (feature.properties.kind === 'sidepath') {
      sidepaths.features.push(feature)
      continue
    }

    if (feature.properties.hasCenterlinePresence) {
      centerlinePresence.features.push(feature)
    }

    highways.features.push(feature)
  }

  return { highways, sidepaths, missing, centerlinePresence, parentHits, selectedHit }
}

export function BicycleBandSource({
  features,
  selectedRef,
  focus,
}: {
  features: BicycleFeatureCollection
  selectedRef: OsmFeatureRef | null
  focus: string
}) {
  const bandPaint = buildBicycleBandPaint(focus)
  const { highways, sidepaths, missing, centerlinePresence, parentHits, selectedHit } =
    splitFeatures(features, selectedRef, focus)
  const selectedIsSidepath = selectedHit.features[0]?.properties.kind === 'sidepath'

  return (
    <>
      {highways.features.length > 0 ? (
        <Source id="bicycle-highways-source" type="geojson" data={highways}>
          <Layer
            id="bicycle-highways-band-layer"
            type="line"
            paint={bandPaint}
            layout={bicycleLineLayout}
          />
          <Layer
            id="bicycle-highways-hitarea-layer"
            type="line"
            paint={bicycleHitAreaPaint}
            layout={bicycleLineLayout}
          />
        </Source>
      ) : null}

      {parentHits.features.length > 0 ? (
        <Source id="bicycle-parent-hit-source" type="geojson" data={parentHits}>
          <Layer
            id="bicycle-parent-hitarea-layer"
            type="line"
            paint={bicycleHitAreaPaint}
            layout={bicycleLineLayout}
          />
        </Source>
      ) : null}

      <MissingDataCenterlineSource
        sourceId="bicycle-missing-source"
        layerIdPrefix={bicycleMissingLayerIdPrefix}
        collection={missing}
        layout={bicycleLineLayout}
      />

      {centerlinePresence.features.length > 0 ? (
        <Source id="bicycle-centerline-presence-source" type="geojson" data={centerlinePresence}>
          <Layer
            id="bicycle-centerline-presence-layer"
            type="line"
            paint={centerlinePresencePaint}
            layout={bicycleLineLayout}
          />
        </Source>
      ) : null}

      {sidepaths.features.length > 0 ? (
        <Source id="bicycle-sidepaths-source" type="geojson" data={sidepaths}>
          <Layer
            id="bicycle-sidepaths-band-layer"
            type="line"
            paint={sidepathBandPaint}
            layout={sidepathLineLayout}
          />
          <Layer
            id="bicycle-sidepaths-hitarea-layer"
            type="line"
            paint={sidepathHitAreaPaint}
            layout={sidepathLineLayout}
          />
        </Source>
      ) : null}

      {selectedHit.features.length > 0 ? (
        <Source id="bicycle-selected-hit-source" type="geojson" data={selectedHit}>
          <Layer
            id={bicycleSelectedHitAreaLayerId}
            type="line"
            paint={
              selectedIsSidepath ? selectedBicycleSidepathHitAreaPaint : selectedBicycleHitAreaPaint
            }
            layout={selectedIsSidepath ? sidepathLineLayout : bicycleLineLayout}
          />
        </Source>
      ) : null}
    </>
  )
}
