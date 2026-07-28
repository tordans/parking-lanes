import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import {
  focusCaseColor,
  focusCaseOpacity,
  lineWidthFromMeters,
  MAP_FOCUS_MUTED_COLOR,
  MAP_FOCUS_MUTED_OPACITY,
} from '@osm-editor-kit/osm-maplibre'
import {
  ROUND_LINE_LAYOUT,
  SIDEPATH_LINE_OFFSET,
  transparentLineHitPaint,
} from '../../../shell/map/map-hit-paint'
import { WIDTH_KIND_COLORS, WIDTH_SELECTION_COLORS } from './width-colors'

const bandActiveOpacity = 0.55

export { ROUND_LINE_LAYOUT as widthLineLayout }
/** Sidepaths use the same round layout; offset belongs in paint. */
export { ROUND_LINE_LAYOUT as sidepathLineLayout }

const widthKindColor = [
  'match',
  ['get', 'widthKind'],
  'explicit',
  WIDTH_KIND_COLORS.explicit,
  'default',
  WIDTH_KIND_COLORS.default,
  WIDTH_KIND_COLORS.default,
] as const

/** Active when the feature matches the focus filter and (optionally) car-only selection dimming. */
function activeInfraMatch(focus: string, dimNonCar: boolean): unknown | null {
  const clauses: unknown[] = []
  if (focus !== 'all') clauses.push(['==', ['get', 'infra'], focus])
  if (dimNonCar) clauses.push(['==', ['get', 'infra'], 'car'])
  if (clauses.length === 0) return null
  if (clauses.length === 1) return clauses[0]
  return ['all', ...clauses]
}

/** Matches the selected carriageway (no prefix/side), or null when nothing applies. */
function selectedHighwayMatch(selectedRef: OsmFeatureRef | null): unknown | null {
  if (!selectedRef || selectedRef.type !== 'way') return null
  if (selectedRef.prefix != null || selectedRef.side != null) return null
  return ['==', ['get', 'osmId'], selectedRef.id]
}

/** Matches the selected sidepath (prefix + side), or null when nothing applies. */
function selectedSidepathMatch(selectedRef: OsmFeatureRef | null): unknown | null {
  if (!selectedRef || selectedRef.type !== 'way') return null
  if (selectedRef.prefix == null || selectedRef.side == null) return null
  return [
    'all',
    ['==', ['get', 'osmId'], selectedRef.id],
    ['==', ['get', 'prefix'], selectedRef.prefix],
    ['==', ['get', 'side'], selectedRef.side],
  ]
}

/**
 * The selected band renders invisible so the black hairline and handles stay readable, but the
 * layer keeps the feature so it remains the click target (no oversized transparent buffers).
 */
function withSelectedBandHidden(
  paint: Record<string, unknown>,
  match: unknown | null,
): Record<string, unknown> {
  if (!match) return paint
  return { ...paint, 'line-opacity': ['case', match, 0, paint['line-opacity']] }
}

export function buildBandPaint(
  focus: string,
  dimNonCar = false,
  selectedRef: OsmFeatureRef | null = null,
) {
  const matchExpr = activeInfraMatch(focus, dimNonCar)

  const paint = !matchExpr
    ? ({
        'line-color': widthKindColor,
        'line-opacity': bandActiveOpacity,
        'line-width': lineWidthFromMeters('roadWidthM'),
      } as Record<string, unknown>)
    : ({
        'line-color': focusCaseColor(matchExpr, widthKindColor),
        'line-opacity': focusCaseOpacity(matchExpr, bandActiveOpacity),
        'line-width': lineWidthFromMeters('roadWidthM'),
      } as Record<string, unknown>)

  return withSelectedBandHidden(paint, selectedHighwayMatch(selectedRef))
}

export function buildSidepathBandPaint(muted = false, selectedRef: OsmFeatureRef | null = null) {
  const paint = !muted
    ? ({
        'line-color': widthKindColor,
        'line-opacity': bandActiveOpacity,
        'line-width': lineWidthFromMeters('roadWidthM'),
        'line-offset': SIDEPATH_LINE_OFFSET,
      } as Record<string, unknown>)
    : ({
        'line-color': MAP_FOCUS_MUTED_COLOR,
        'line-opacity': MAP_FOCUS_MUTED_OPACITY,
        'line-width': lineWidthFromMeters('roadWidthM'),
        'line-offset': SIDEPATH_LINE_OFFSET,
      } as Record<string, unknown>)

  return withSelectedBandHidden(paint, selectedSidepathMatch(selectedRef))
}

export const sidepathCenterlinePaint = {
  'line-offset': SIDEPATH_LINE_OFFSET,
} as Record<string, unknown>

export const handleFillPaint = {
  'fill-color': WIDTH_SELECTION_COLORS.accent,
  'fill-opacity': 0.08,
} as Record<string, unknown>

export const handleStrokePaint = {
  'line-color': WIDTH_SELECTION_COLORS.accent,
  'line-width': 1,
  'line-opacity': 0.9,
} as Record<string, unknown>

export const handleCuePaint = {
  'circle-color': WIDTH_SELECTION_COLORS.accent,
  'circle-radius': 3,
  'circle-stroke-width': 1,
  'circle-stroke-color': '#ffffff',
} as Record<string, unknown>

export const handleHitAreaPaint = transparentLineHitPaint(14)
