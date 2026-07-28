import { focusCaseColor, focusCaseOpacity } from '@osm-editor-kit/osm-maplibre'
import type { FilterSpecification } from 'maplibre-gl'
import {
  ROUND_LINE_LAYOUT,
  SIDEPATH_LINE_OFFSET,
  transparentLineHitPaint,
} from '../../../shell/map/map-hit-paint'
import {
  MISSING_SMOOTHNESS_BASE_COLOR,
  MISSING_SMOOTHNESS_OVERLAY_COLOR,
  SMOOTHNESS_COLORS,
} from './surface-colors'

const bandActiveOpacity = 0.85
const bandMutedOpacity = 0.35
const dottedActiveOpacity = 0.9
const dottedMutedOpacity = 0.35

export { ROUND_LINE_LAYOUT as surfaceLineLayout }
/** Sidepaths use the same round layout; offset belongs in paint. */
export { ROUND_LINE_LAYOUT as sidepathLineLayout }

const surfaceColor = [
  'case',
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

/**
 * Surface mode paints two categorical widths (major road vs everything else) instead of the
 * physical road width used by width mode.
 */
const surfaceMajorLineWidth = ['interpolate', ['linear'], ['zoom'], 12, 3, 16, 7, 20, 12] as const
const surfaceOtherLineWidth = ['interpolate', ['linear'], ['zoom'], 12, 2, 16, 4, 20, 7] as const

const surfaceBandLineWidth = [
  'case',
  ['get', 'isMajor'],
  surfaceMajorLineWidth,
  surfaceOtherLineWidth,
] as const

const surfaceHitLineWidth = [
  'case',
  ['get', 'isMajor'],
  ['interpolate', ['linear'], ['zoom'], 12, 8, 16, 14, 20, 20],
  ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 10, 20, 14],
] as const

function withOptionalSidepathOffset(
  paint: Record<string, unknown>,
  forSidepath: boolean,
): Record<string, unknown> {
  if (!forSidepath) return paint
  return { ...paint, 'line-offset': SIDEPATH_LINE_OFFSET }
}

export function buildSurfaceBandPaint(focus: string, hasSelection = false, forSidepath = false) {
  const opacity = hasSelection ? bandMutedOpacity : bandActiveOpacity
  const basePaint = {
    'line-color': surfaceColor,
    'line-opacity': opacity,
    'line-width': surfaceBandLineWidth,
  } as Record<string, unknown>

  if (focus === 'all') return withOptionalSidepathOffset(basePaint, forSidepath)

  const matchExpr = ['==', ['get', 'infra'], focus]

  return withOptionalSidepathOffset(
    {
      'line-color': focusCaseColor(matchExpr, surfaceColor),
      'line-opacity': focusCaseOpacity(matchExpr, opacity, bandMutedOpacity),
      'line-width': surfaceBandLineWidth,
    } as Record<string, unknown>,
    forSidepath,
  )
}

export function buildSurfaceDottedOverlayPaint(hasSelection = false, forSidepath = false) {
  return withOptionalSidepathOffset(
    {
      'line-color': MISSING_SMOOTHNESS_OVERLAY_COLOR,
      'line-opacity': hasSelection ? dottedMutedOpacity : dottedActiveOpacity,
      'line-width': surfaceBandLineWidth,
      'line-dasharray': [0.5, 1.5],
    } as Record<string, unknown>,
    forSidepath,
  )
}

export const surfaceDottedOverlayFilter: FilterSpecification = [
  'all',
  ['==', ['get', 'missingSmoothness'], true],
  ['!=', ['get', 'missingSurface'], true],
]

export const surfaceHitAreaPaint = transparentLineHitPaint(surfaceHitLineWidth)

export const sidepathHitAreaPaint = {
  ...transparentLineHitPaint(surfaceHitLineWidth),
  'line-offset': SIDEPATH_LINE_OFFSET,
} as Record<string, unknown>

export const sidepathCenterlinePaint = {
  'line-offset': SIDEPATH_LINE_OFFSET,
} as Record<string, unknown>
