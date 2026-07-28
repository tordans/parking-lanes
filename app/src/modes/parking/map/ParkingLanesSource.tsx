import { Layer, Source } from 'react-map-gl/maplibre'
import {
  MissingDataCenterlineSource,
  missingDataHitAreaLayerId,
} from '../../../shell/map/MissingDataCenterlineSource'
import { SelectedWayCenterlineSource } from '../../../shell/map/SelectedWayCenterlineSource'
import { useMapLayerExists } from '../../../shell/map/use-map-layer-exists'
import {
  buildLanePaint,
  buildSelectedLanePaint,
  parkingHitAreaLinePaint,
  parkingLineLayout,
} from './parking-layer-paint'
import { ParkingBacklightsSource } from './ParkingBacklightsSource'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

export const parkingMissingLayerIdPrefix = 'parking-missing'
export const parkingMissingHitAreaLayerId = missingDataHitAreaLayerId(parkingMissingLayerIdPrefix)
export const parkingCenterlinesLayerId = 'parking-centerlines-layer'

function splitLaneFeatures(collection: ParkingFeatureCollection, selectedWayId: number | null) {
  const base: ParkingFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selected: ParkingFeatureCollection = { type: 'FeatureCollection', features: [] }
  const missing: ParkingFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of collection.features) {
    if (feature.properties.kind === 'missing') {
      if (selectedWayId != null && feature.properties.osmId === selectedWayId) continue
      missing.features.push(feature)
      continue
    }
    if (feature.properties.kind !== 'lane') continue
    if (selectedWayId != null && feature.properties.osmId === selectedWayId) {
      selected.features.push(feature)
    } else {
      base.features.push(feature)
    }
  }

  return { base, selected, missing }
}

function centerlinesFromLanes(
  collection: ParkingFeatureCollection,
  selectedWayId: number | null,
): ParkingFeatureCollection {
  const seen = new Set<number>()
  const features: ParkingFeature[] = []

  for (const feature of collection.features) {
    if (feature.properties.kind !== 'lane') continue
    const osmId = feature.properties.osmId
    // When a way is selected, only its centerline is drawn (selection chrome).
    if (selectedWayId != null && osmId !== selectedWayId) continue
    if (seen.has(osmId)) continue
    seen.add(osmId)
    features.push({
      ...feature,
      id: `centerline-${osmId}`,
      properties: {
        ...feature.properties,
        featureId: `centerline-${osmId}`,
        offset: 0,
        weight: 1,
      },
    })
  }

  // Selected missing way still needs black selection chrome.
  if (selectedWayId != null) {
    for (const feature of collection.features) {
      if (feature.properties.kind !== 'missing') continue
      if (feature.properties.osmId !== selectedWayId) continue
      if (seen.has(selectedWayId)) break
      seen.add(selectedWayId)
      features.push({
        ...feature,
        id: `centerline-${selectedWayId}`,
        properties: {
          ...feature.properties,
          featureId: `centerline-${selectedWayId}`,
          offset: 0,
          weight: 1,
        },
      })
      break
    }
  }

  return { type: 'FeatureCollection', features }
}

export function ParkingLanesSource({
  collection,
  focus,
  selectedWayId,
  backlights,
}: {
  collection: ParkingFeatureCollection
  focus: string
  selectedWayId: number | null
  /** Selection chrome for untagged ways; stacked under the centerline via beforeId. */
  backlights: ParkingFeatureCollection
}) {
  // Wait until the centerline is actually on the map — React sibling order is not enough;
  // react-map-gl may create sibling Source layers across separate style updates.
  const centerlineReady = useMapLayerExists(parkingCenterlinesLayerId)

  if (!collection.features.length) return null

  const { base, selected, missing } = splitLaneFeatures(collection, selectedWayId)
  const centerlines = centerlinesFromLanes(collection, selectedWayId)
  const hasSelection = selectedWayId != null
  // Untagged selection has no lane bands — orange/purple backlights fill in.
  const showSelectionBacklights =
    selectedWayId != null && selected.features.length === 0 && centerlines.features.length > 0

  return (
    <>
      {base.features.length > 0 ? (
        <Source id="parking-lanes-source" type="geojson" data={base}>
          <Layer
            id="parking-lanes-layer"
            type="line"
            paint={buildLanePaint(focus, hasSelection)}
            layout={parkingLineLayout}
          />
          <Layer
            id="parking-lanes-hitarea-layer"
            type="line"
            paint={parkingHitAreaLinePaint}
            layout={parkingLineLayout}
          />
        </Source>
      ) : null}

      <MissingDataCenterlineSource
        sourceId="parking-missing-source"
        layerIdPrefix={parkingMissingLayerIdPrefix}
        collection={missing}
        layout={parkingLineLayout}
      />

      {/* Mount centerline before side chrome so beforeId has a stable target. */}
      <SelectedWayCenterlineSource
        sourceId="parking-centerlines-source"
        layerId={parkingCenterlinesLayerId}
        collection={centerlines}
        layout={parkingLineLayout}
      />

      {selected.features.length > 0 && centerlineReady ? (
        <Source id="parking-selected-lanes-source" type="geojson" data={selected}>
          {/* beforeId keeps side bands under the black hairline when they mount later
              (MapLibre otherwise appends new layers on top). */}
          <Layer
            id="parking-selected-lanes-layer"
            type="line"
            paint={buildSelectedLanePaint(focus)}
            layout={parkingLineLayout}
            beforeId={parkingCenterlinesLayerId}
          />
          <Layer
            id="parking-selected-lanes-hitarea-layer"
            type="line"
            paint={parkingHitAreaLinePaint}
            layout={parkingLineLayout}
            beforeId={parkingCenterlinesLayerId}
          />
        </Source>
      ) : null}

      {showSelectionBacklights && centerlineReady ? (
        <ParkingBacklightsSource
          collection={backlights}
          focus={focus}
          beforeId={parkingCenterlinesLayerId}
        />
      ) : null}
    </>
  )
}
