import { lineOffsetFromMeters } from '@osm-editor-kit/osm-maplibre'

export const ROUND_LINE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' } as const

/**
 * MapLibre `line-offset` is a **paint** property (not layout). Use on sidepath layers so
 * left/right bands sit beside the carriageway.
 * A positive offset moves the line to the right of the way direction (OSM `:left` / `:right`
 * convention, same as parking), so `left` needs the negative sign.
 * Side sign is folded into {@link lineOffsetFromMeters} stop outputs — wrapping that
 * interpolate in `*` nests `zoom` and MapLibre rejects the layer.
 */
export const SIDEPATH_LINE_OFFSET = lineOffsetFromMeters('parentRoadWidthM', 0.5, {
  sign: ['case', ['==', ['get', 'side'], 'left'], -1, 1],
})

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
