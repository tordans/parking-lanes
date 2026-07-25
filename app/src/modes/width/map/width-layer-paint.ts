import {
  focusCaseColor,
  focusCaseOpacity,
  lineOffsetFromMeters,
  lineWidthFromMeters,
  selectedCenterlineWidth,
} from '@osm-editor-kit/osm-maplibre'
import { ROUND_LINE_LAYOUT, transparentLineHitPaint } from '../../../shell/map/map-hit-paint'
import { WIDTH_KIND_COLORS } from './width-colors'

const bandActiveOpacity = 0.55

export { ROUND_LINE_LAYOUT as widthLineLayout }

const widthKindColor = [
  'match',
  ['get', 'widthKind'],
  'explicit',
  WIDTH_KIND_COLORS.explicit,
  'default',
  WIDTH_KIND_COLORS.default,
  WIDTH_KIND_COLORS.default,
] as const

export function buildBandPaint(focus: string) {
  if (focus === 'all') {
    return {
      'line-color': widthKindColor,
      'line-opacity': bandActiveOpacity,
      'line-width': lineWidthFromMeters('roadWidthM'),
    } as Record<string, unknown>
  }

  const matchExpr = ['==', ['get', 'infra'], focus]

  return {
    'line-color': focusCaseColor(matchExpr, widthKindColor),
    'line-opacity': focusCaseOpacity(matchExpr, bandActiveOpacity),
    'line-width': lineWidthFromMeters('roadWidthM'),
  } as Record<string, unknown>
}

export const sidepathBandPaint = {
  'line-color': widthKindColor,
  'line-opacity': bandActiveOpacity,
  'line-width': lineWidthFromMeters('roadWidthM'),
} as Record<string, unknown>

export const sidepathLineLayout = {
  ...ROUND_LINE_LAYOUT,
  'line-offset': [
    '*',
    ['case', ['==', ['get', 'side'], 'left'], 1, -1],
    lineOffsetFromMeters('parentRoadWidthM', 0.5),
  ],
} as const

export const widthHitAreaPaint = transparentLineHitPaint(
  lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
)

export const sidepathHitAreaPaint = transparentLineHitPaint(
  lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
)

export const selectedCenterlinePaint = {
  'line-color': '#1d4ed8',
  'line-width': selectedCenterlineWidth,
} as Record<string, unknown>

export const handleFillPaint = {
  'fill-color': '#3b82f6',
  'fill-opacity': 0.08,
} as Record<string, unknown>

export const handleStrokePaint = {
  'line-color': '#1d4ed8',
  'line-width': 1,
  'line-opacity': 0.9,
} as Record<string, unknown>

export const handleCuePaint = {
  'circle-color': '#1d4ed8',
  'circle-radius': 3,
  'circle-stroke-width': 1,
  'circle-stroke-color': '#ffffff',
} as Record<string, unknown>

export const handleHitAreaPaint = transparentLineHitPaint(14)
