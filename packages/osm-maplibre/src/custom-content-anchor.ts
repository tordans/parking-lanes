import type { StyleSpecification } from 'maplibre-gl'

/** Empty GeoJSON source + invisible top layer for `beforeId` stacking of app overlays. */
export const MAP_CUSTOM_CONTENT_ANCHOR_SOURCE_ID = 'map-custom-content-anchor'
export const MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID = 'map-custom-content-anchor'

export function appendCustomContentAnchor(style: StyleSpecification): StyleSpecification {
  const hasAnchorLayer = style.layers.some(
    (layer) => layer.id === MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID,
  )
  if (hasAnchorLayer) return style

  return {
    ...style,
    sources: {
      ...style.sources,
      [MAP_CUSTOM_CONTENT_ANCHOR_SOURCE_ID]: {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    },
    layers: [
      ...style.layers,
      {
        id: MAP_CUSTOM_CONTENT_ANCHOR_LAYER_ID,
        type: 'fill',
        source: MAP_CUSTOM_CONTENT_ANCHOR_SOURCE_ID,
        layout: { visibility: 'none' },
        paint: { 'fill-opacity': 0 },
      },
    ],
  }
}
