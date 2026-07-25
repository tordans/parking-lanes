import { focusCaseColor, focusCaseOpacity } from '@osm-editor-kit/osm-maplibre'
import {
  ROUND_LINE_LAYOUT,
  invisibleHitAreaCirclePaint,
  transparentLineHitPaint,
} from '../../../shell/map/map-hit-paint'

const laneActiveOpacity = 1
const areaActiveOpacity = 0.35
const pointActiveOpacity = 0.6
const backlightActiveOpacity = 0.4

const missingSurfaceMatch = ['==', ['get', 'missingSurface'], 1]

/** Extra px beyond painted lane span for forgiving hover/click. */
const HIT_AREA_PADDING = 3

export { ROUND_LINE_LAYOUT as parkingLineLayout }

export const parkingHitAreaCirclePaint = invisibleHitAreaCirclePaint

export const parkingHitAreaLinePaint = transparentLineHitPaint([
  '+',
  ['*', 2, ['abs', ['coalesce', ['get', 'offset'], 0]]],
  ['coalesce', ['get', 'weight'], 2],
  HIT_AREA_PADDING,
])

export function buildLanePaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'line-color': color,
      'line-width': ['coalesce', ['get', 'weight'], 2],
      'line-offset': ['coalesce', ['get', 'offset'], 0],
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(missingSurfaceMatch, color),
    'line-opacity': focusCaseOpacity(missingSurfaceMatch, laneActiveOpacity),
    'line-width': ['coalesce', ['get', 'weight'], 2],
    'line-offset': ['coalesce', ['get', 'offset'], 0],
  } as Record<string, unknown>
}

export function buildAreaPaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'fill-color': color,
      'fill-opacity': areaActiveOpacity,
      'fill-outline-color': color,
    } as Record<string, unknown>
  }

  return {
    'fill-color': focusCaseColor(missingSurfaceMatch, color),
    'fill-opacity': focusCaseOpacity(missingSurfaceMatch, areaActiveOpacity),
    'fill-outline-color': focusCaseColor(missingSurfaceMatch, color),
  } as Record<string, unknown>
}

export function buildPointPaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'circle-color': color,
      'circle-radius': ['coalesce', ['get', 'weight'], 4],
      'circle-opacity': pointActiveOpacity,
      'circle-stroke-width': 0,
    } as Record<string, unknown>
  }

  return {
    'circle-color': focusCaseColor(missingSurfaceMatch, color),
    'circle-radius': ['coalesce', ['get', 'weight'], 4],
    'circle-opacity': focusCaseOpacity(missingSurfaceMatch, pointActiveOpacity),
    'circle-stroke-width': 0,
  } as Record<string, unknown>
}

export function buildBacklightPaint(focus: string) {
  const color = ['get', 'color']
  if (focus !== 'noSurface') {
    return {
      'line-color': color,
      'line-width': ['coalesce', ['get', 'weight'], 2],
      'line-offset': ['coalesce', ['get', 'offset'], 0],
      'line-opacity': backlightActiveOpacity,
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(missingSurfaceMatch, color),
    'line-width': ['coalesce', ['get', 'weight'], 2],
    'line-offset': ['coalesce', ['get', 'offset'], 0],
    'line-opacity': focusCaseOpacity(missingSurfaceMatch, backlightActiveOpacity),
  } as Record<string, unknown>
}
