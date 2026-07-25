export const ROUND_LINE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' } as const

/** Zoom-interpolated transparent circle used for forgiving point hit targets. */
export const invisibleHitAreaCirclePaint = {
  'circle-color': '#000',
  'circle-opacity': 0,
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 12, 14, 14, 22, 16],
  'circle-stroke-width': 0,
} as Record<string, unknown>

export function transparentLineHitPaint(widthExpr: unknown): Record<string, unknown> {
  return {
    'line-color': '#000',
    'line-opacity': 0,
    'line-width': widthExpr,
  }
}
