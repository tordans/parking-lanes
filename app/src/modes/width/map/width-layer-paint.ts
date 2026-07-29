import { focusCaseColor, focusCaseOpacity, lineWidthFromMeters } from '@osm-editor-kit/osm-maplibre'
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

export function buildBandPaint(focus: string, dimNonCar = false) {
  const matchExpr = activeInfraMatch(focus, dimNonCar)

  if (!matchExpr) {
    return {
      'line-color': widthKindColor,
      'line-opacity': bandActiveOpacity,
      'line-width': lineWidthFromMeters('roadWidthM'),
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(matchExpr, widthKindColor),
    'line-opacity': focusCaseOpacity(matchExpr, bandActiveOpacity),
    'line-width': lineWidthFromMeters('roadWidthM'),
  } as Record<string, unknown>
}

export function buildSidepathBandPaint() {
  return {
    'line-color': widthKindColor,
    'line-opacity': bandActiveOpacity,
    'line-width': lineWidthFromMeters('roadWidthM'),
    'line-offset': SIDEPATH_LINE_OFFSET,
  } as Record<string, unknown>
}

/** Invisible full-width hit target for the selected way (band is omitted while selected). */
export const selectedWidthHitAreaPaint = transparentLineHitPaint(lineWidthFromMeters('roadWidthM'))

export const selectedWidthSidepathHitAreaPaint = {
  ...transparentLineHitPaint(lineWidthFromMeters('roadWidthM')),
  'line-offset': SIDEPATH_LINE_OFFSET,
} as Record<string, unknown>

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
