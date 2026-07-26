import { Layer, Source } from 'react-map-gl/maplibre'
import { SelectedWayCenterlineSource } from '../../../shell/map/SelectedWayCenterlineSource'
import { buildLanePaint, parkingHitAreaLinePaint, parkingLineLayout } from './parking-layer-paint'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

function splitLaneFeatures(collection: ParkingFeatureCollection, selectedWayId: number | null) {
  const base: ParkingFeatureCollection = { type: 'FeatureCollection', features: [] }

  for (const feature of collection.features) {
    if (feature.properties.kind !== 'lane') continue
    // Omit the selection so lane colors do not paint over the black centerline.
    if (selectedWayId != null && feature.properties.osmId === selectedWayId) continue
    base.features.push(feature)
  }

  return base
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

  const base = splitLaneFeatures(collection, selectedWayId)
  const centerlines = centerlinesFromLanes(collection, selectedWayId)
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

      <SelectedWayCenterlineSource
        sourceId="parking-centerlines-source"
        layerId="parking-centerlines-layer"
        collection={centerlines}
        layout={parkingLineLayout}
      />
    </>
  )
}
