import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { useSelectedOsmRef } from './feature-selection'
import { WAY_CUT_MARKERS_LAYER_PREFIX, WAY_CUT_PREVIEW_HITAREA_LAYER_ID } from './use-way-cut'
import {
  useIsCutActive,
  useWayCutHoveredNodeId,
  useWayCutMarkers,
  useWayCutPreview,
  type WayCutMarkerCollection,
  type WayCutMarkerFeature,
} from './way-cut-store'

const markerPaint = {
  'circle-color': ['get', 'color'],
  'circle-radius': [
    'case',
    ['boolean', ['get', 'isHovered'], false],
    12,
    ['coalesce', ['get', 'weight'], 4],
  ],
  'circle-opacity': 0.85,
  'circle-stroke-width': ['case', ['boolean', ['get', 'isHovered'], false], 3, 1],
  'circle-stroke-color': '#854d0e',
} as Record<string, unknown>

const previewPaint = {
  'circle-color': 'rgba(0,0,0,0)',
  'circle-radius': 9,
  'circle-stroke-width': 3,
  'circle-stroke-color': '#fffc7e',
} as Record<string, unknown>

const hitAreaCirclePaint = {
  'circle-color': '#000',
  'circle-opacity': 0,
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 12, 14, 14, 22, 16],
  'circle-stroke-width': 0,
} as Record<string, unknown>

const previewHitAreaPaint = {
  'circle-color': '#000',
  'circle-opacity': 0,
  'circle-radius': 14,
  'circle-stroke-width': 0,
} as Record<string, unknown>

export function WayCutLayers() {
  const isCutActive = useIsCutActive()
  const cutMarkers = useWayCutMarkers()
  const hoveredNodeId = useWayCutHoveredNodeId()
  const preview = useWayCutPreview()
  const selectedOsmRef = useSelectedOsmRef()
  const selectedWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : 0

  const geojson = useMemo((): WayCutMarkerCollection => {
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
  }, [cutMarkers.features, hoveredNodeId, preview, selectedWayId])

  if (!isCutActive) return null

  const sourceId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-source`
  const layerId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-layer`
  const hitAreaLayerId = `${WAY_CUT_MARKERS_LAYER_PREFIX}-hitarea-layer`

  return (
    <Source id={sourceId} type="geojson" data={geojson}>
      <Layer
        id={layerId}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-marker']}
        paint={markerPaint}
      />
      <Layer
        id={`${layerId}-preview`}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-preview']}
        paint={previewPaint}
      />
      <Layer
        id={hitAreaLayerId}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-marker']}
        paint={hitAreaCirclePaint}
      />
      <Layer
        id={WAY_CUT_PREVIEW_HITAREA_LAYER_ID}
        type="circle"
        filter={['==', ['get', 'kind'], 'cut-preview']}
        paint={previewHitAreaPaint}
      />
    </Source>
  )
}
