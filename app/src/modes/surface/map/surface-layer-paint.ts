import {
  focusCaseColor,
  focusCaseOpacity,
  lineOffsetFromMeters,
  lineWidthFromMeters,
} from '@osm-editor-kit/osm-maplibre'
import type { FilterSpecification } from 'maplibre-gl'
import { ROUND_LINE_LAYOUT, transparentLineHitPaint } from '../../../shell/map/map-hit-paint'
import {
  MISSING_SMOOTHNESS_BASE_COLOR,
  MISSING_SMOOTHNESS_OVERLAY_COLOR,
  MISSING_SURFACE_COLOR,
  SMOOTHNESS_COLORS,
} from './surface-colors'

const bandActiveOpacity = 0.85
const bandMutedOpacity = 0.35
const dottedActiveOpacity = 0.9
const dottedMutedOpacity = 0.35

export { ROUND_LINE_LAYOUT as surfaceLineLayout }

const surfaceColor = [
  'case',
  ['get', 'missingSurface'],
  MISSING_SURFACE_COLOR,
  ['get', 'missingSmoothness'],
  MISSING_SMOOTHNESS_BASE_COLOR,
  [
    'match',
    ['get', 'smoothness'],
    'very_bad',
    SMOOTHNESS_COLORS.very_bad,
    'bad',
    SMOOTHNESS_COLORS.bad,
    'intermediate',
    SMOOTHNESS_COLORS.intermediate,
    'good',
    SMOOTHNESS_COLORS.good,
    'excellent',
    SMOOTHNESS_COLORS.excellent,
    MISSING_SMOOTHNESS_BASE_COLOR,
  ],
] as const

export function buildSurfaceBandPaint(focus: string, hasSelection = false) {
  const opacity = hasSelection ? bandMutedOpacity : bandActiveOpacity
  const basePaint = {
    'line-color': surfaceColor,
    'line-opacity': opacity,
    'line-width': lineWidthFromMeters('roadWidthM'),
  } as Record<string, unknown>

  if (focus === 'all') return basePaint

  const matchExpr = ['==', ['get', 'infra'], focus]

  return {
    'line-color': focusCaseColor(matchExpr, surfaceColor),
    'line-opacity': focusCaseOpacity(matchExpr, opacity, bandMutedOpacity),
    'line-width': lineWidthFromMeters('roadWidthM'),
  } as Record<string, unknown>
}

export function buildSurfaceDottedOverlayPaint(hasSelection = false) {
  return {
    'line-color': MISSING_SMOOTHNESS_OVERLAY_COLOR,
    'line-opacity': hasSelection ? dottedMutedOpacity : dottedActiveOpacity,
    'line-width': lineWidthFromMeters('roadWidthM'),
    'line-dasharray': [0.5, 1.5],
  } as Record<string, unknown>
}

export const surfaceDottedOverlayFilter: FilterSpecification = [
  'all',
  ['==', ['get', 'missingSmoothness'], true],
  ['!=', ['get', 'missingSurface'], true],
]

export const sidepathLineLayout = {
  ...ROUND_LINE_LAYOUT,
  'line-offset': [
    '*',
    ['case', ['==', ['get', 'side'], 'left'], 1, -1],
    lineOffsetFromMeters('parentRoadWidthM', 0.5),
  ],
} as const

export const surfaceHitAreaPaint = transparentLineHitPaint(
  lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
)

export const sidepathHitAreaPaint = transparentLineHitPaint(
  lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
)
