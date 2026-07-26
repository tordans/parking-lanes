import { Layer, Source } from 'react-map-gl/maplibre'
import {
  buildLanePaint,
  buildSelectedLanePaint,
  parkingCenterlinePaint,
  parkingHitAreaLinePaint,
  parkingLineLayout,
} from './parking-layer-paint'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

function splitLaneFeatures(collection: ParkingFeatureCollection, selectedWayId: number | null) {
  const base: ParkingFeatureCollection = { type: 'FeatureCollection', features: [] }
  const selected: ParkingFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of collection.features) {
    if (feature.properties.kind !== 'lane') continue
    if (selectedWayId != null && feature.properties.osmId === selectedWayId) {
      selected.features.push(feature)
    } else {
      base.features.push(feature)
    }
  }

  return { base, selected }
}

function centerlinesFromLanes(collection: ParkingFeatureCollection): ParkingFeatureCollection {
  const seen = new Set<number>()
  const features: ParkingFeature[] = []

  for (const feature of collection.features) {
    if (feature.properties.kind !== 'lane') continue
    const osmId = feature.properties.osmId
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

  return { type: 'FeatureCollection', features }
}

export function ParkingLanesSource({
  collection,
  focus,
  selectedWayId,
}: {
  collection: ParkingFeatureCollection
  focus: string
  selectedWayId: number | null
}) {
  if (!collection.features.length) return null

  const { base, selected } = splitLaneFeatures(collection, selectedWayId)
  const centerlines = centerlinesFromLanes(collection)
  const hasSelection = selectedWayId != null

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

      {selected.features.length > 0 ? (
        <Source id="parking-selected-lanes-source" type="geojson" data={selected}>
          <Layer
            id="parking-selected-lanes-layer"
            type="line"
            paint={buildSelectedLanePaint(focus)}
            layout={parkingLineLayout}
          />
          <Layer
            id="parking-selected-lanes-hitarea-layer"
            type="line"
            paint={parkingHitAreaLinePaint}
            layout={parkingLineLayout}
          />
        </Source>
      ) : null}

      {centerlines.features.length > 0 ? (
        <Source id="parking-centerlines-source" type="geojson" data={centerlines}>
          <Layer
            id="parking-centerlines-layer"
            type="line"
            paint={parkingCenterlinePaint}
            layout={parkingLineLayout}
          />
        </Source>
      ) : null}
    </>
  )
}
