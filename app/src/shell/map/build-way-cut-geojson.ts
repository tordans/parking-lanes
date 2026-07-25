import type { WayCutMarkerCollection, WayCutMarkerFeature } from './way-cut-store'

export function buildWayCutGeojson({
  cutMarkers,
  hoveredNodeId,
  preview,
  selectedWayId,
}: {
  cutMarkers: WayCutMarkerCollection
  hoveredNodeId: number | null
  preview: { lng: number; lat: number } | null
  selectedWayId: number
}): WayCutMarkerCollection {
  const markerFeatures = cutMarkers.features.map(
    (feature): WayCutMarkerFeature => ({
      ...feature,
      properties: {
        ...feature.properties,
        isHovered: feature.properties.nodeId === hoveredNodeId,
      },
    }),
  )

  const previewFeatures: WayCutMarkerFeature[] = preview
    ? [
        {
          type: 'Feature',
          id: 'cut-preview',
          geometry: { type: 'Point', coordinates: [preview.lng, preview.lat] },
          properties: {
            featureId: 'cut-preview',
            kind: 'cut-preview',
            color: '#fffc7e',
            weight: 9,
            wayId: selectedWayId,
            osmType: 'node',
          },
        },
      ]
    : []

  return {
    type: 'FeatureCollection',
    features: [...markerFeatures, ...previewFeatures],
  }
}
