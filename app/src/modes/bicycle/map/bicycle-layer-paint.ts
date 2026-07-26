import {
  focusCaseColor,
  focusCaseOpacity,
  lineOffsetFromMeters,
  lineWidthFromMeters,
} from '@osm-editor-kit/osm-maplibre'
import { ROUND_LINE_LAYOUT, transparentLineHitPaint } from '../../../shell/map/map-hit-paint'
import { BICYCLE_PAINT_COLORS } from './bicycle-colors'

const bandActiveOpacity = 0.65

export { ROUND_LINE_LAYOUT as bicycleLineLayout }

const paintStateColor = [
  'match',
  ['get', 'paintState'],
  'complete',
  BICYCLE_PAINT_COLORS.complete,
  'incomplete',
  BICYCLE_PAINT_COLORS.incomplete,
  'separateGeometry',
  BICYCLE_PAINT_COLORS.separateGeometry,
  BICYCLE_PAINT_COLORS.noInfra,
] as const

export function buildBicycleBandPaint(focus: string) {
  if (focus === 'all') {
    return {
      'line-color': paintStateColor,
      'line-opacity': bandActiveOpacity,
      'line-width': lineWidthFromMeters('roadWidthM'),
    } as Record<string, unknown>
  }

  const matchExpr = ['==', ['get', 'incomplete'], true]

  return {
    'line-color': focusCaseColor(matchExpr, paintStateColor),
    'line-opacity': focusCaseOpacity(matchExpr, bandActiveOpacity),
    'line-width': lineWidthFromMeters('roadWidthM'),
  } as Record<string, unknown>
}

export const sidepathBandPaint = {
  'line-color': paintStateColor,
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

export const bicycleHitAreaPaint = transparentLineHitPaint(
  lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
)

export const sidepathHitAreaPaint = transparentLineHitPaint(
  lineWidthFromMeters('roadWidthM', { extraMeters: 4 }),
)

export const centerlinePresencePaint = {
  'line-color': BICYCLE_PAINT_COLORS.centerlinePresence,
  'line-width': 2,
  'line-dasharray': [2, 2],
  'line-opacity': 0.9,
} as Record<string, unknown>
