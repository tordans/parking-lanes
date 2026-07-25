export const wayCutMarkerPaint = {
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

export const wayCutPreviewPaint = {
  'circle-color': 'rgba(0,0,0,0)',
  'circle-radius': 9,
  'circle-stroke-width': 3,
  'circle-stroke-color': '#fffc7e',
} as Record<string, unknown>

export { invisibleHitAreaCirclePaint as wayCutHitAreaCirclePaint } from './map-hit-paint'

export const wayCutPreviewHitAreaPaint = {
  'circle-color': '#000',
  'circle-opacity': 0,
  'circle-radius': 14,
  'circle-stroke-width': 0,
} as Record<string, unknown>
