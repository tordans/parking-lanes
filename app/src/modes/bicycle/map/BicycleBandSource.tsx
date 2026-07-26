import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { Layer, Source } from 'react-map-gl/maplibre'
import {
  bicycleHitAreaPaint,
  bicycleLineLayout,
  buildBicycleBandPaint,
  centerlinePresencePaint,
  sidepathBandPaint,
  sidepathHitAreaPaint,
  sidepathLineLayout,
} from './bicycle-layer-paint'
import type { BicycleFeatureCollection } from './parse-bikelanes'

function matchesSelection(
  properties: BicycleFeatureCollection['features'][number]['properties'],
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

function splitFeatures(features: BicycleFeatureCollection, selectedRef: OsmFeatureRef | null) {
  const highways: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }
  const sidepaths: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }
  const centerlinePresence: BicycleFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of features.features) {
    // Omit the selection so paint-state colors do not cover the black centerline.
    if (matchesSelection(feature.properties, selectedRef)) continue

    if (feature.properties.kind === 'sidepath') {
      sidepaths.features.push(feature)
      continue
    }

    if (feature.properties.hasCenterlinePresence) {
      centerlinePresence.features.push(feature)
    }

    highways.features.push(feature)
  }

  return { highways, sidepaths, centerlinePresence }
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
  const { highways, sidepaths, centerlinePresence } = splitFeatures(features, selectedRef)

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
    </>
  )
}
