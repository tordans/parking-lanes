import { focusCaseColor, focusCaseOpacity, lineWidthFromMeters } from '@osm-editor-kit/osm-maplibre'
import type { FilterSpecification } from 'maplibre-gl'
import {
  ROUND_LINE_LAYOUT,
  SIDEPATH_LINE_OFFSET,
  transparentLineHitPaint,
} from '../../../shell/map/map-hit-paint'
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
/** Sidepaths use the same round layout; offset belongs in paint. */
export { ROUND_LINE_LAYOUT as sidepathLineLayout }

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
    'line-width': lineWidthFromMeters('roadWidthM'),
  } as Record<string, unknown>

  if (focus === 'all') return withOptionalSidepathOffset(basePaint, forSidepath)

  const matchExpr = ['==', ['get', 'infra'], focus]

  return withOptionalSidepathOffset(
    {
      'line-color': focusCaseColor(matchExpr, surfaceColor),
      'line-opacity': focusCaseOpacity(matchExpr, opacity, bandMutedOpacity),
      'line-width': lineWidthFromMeters('roadWidthM'),
    } as Record<string, unknown>,
    forSidepath,
  )
}

export function buildSurfaceDottedOverlayPaint(hasSelection = false, forSidepath = false) {
  return withOptionalSidepathOffset(
    {
      'line-color': MISSING_SMOOTHNESS_OVERLAY_COLOR,
      'line-opacity': hasSelection ? dottedMutedOpacity : dottedActiveOpacity,
      'line-width': lineWidthFromMeters('roadWidthM'),
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

export const surfaceHitAreaPaint = transparentLineHitPaint(
  lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
)

export const sidepathHitAreaPaint = {
  ...transparentLineHitPaint(lineWidthFromMeters('roadWidthM', { extraMeters: 4 })),
  'line-offset': SIDEPATH_LINE_OFFSET,
} as Record<string, unknown>

export const sidepathCenterlinePaint = {
  'line-offset': SIDEPATH_LINE_OFFSET,
} as Record<string, unknown>
