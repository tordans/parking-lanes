import { focusCaseColor, focusCaseOpacity } from '@osm-editor-kit/osm-maplibre'
import {
  ROUND_LINE_LAYOUT,
  invisibleHitAreaCirclePaint,
  transparentLineHitPaint,
} from '../../../shell/map/map-hit-paint'
import { parkingSideColors } from '../side-colors'

const laneActiveOpacity = 1
const laneMutedOpacity = 0.35
const selectedLaneScale = 1.25
const areaActiveOpacity = 0.35
const pointActiveOpacity = 0.6
const backlightActiveOpacity = 0.4

const missingSurfaceMatch = ['==', ['get', 'missingSurface'], 1]

/** Extra px beyond painted lane span for forgiving hover/click. */
const HIT_AREA_PADDING = 3

const parkingSideLaneColor = [
  'match',
  ['get', 'side'],
  'right',
  parkingSideColors.right,
  'left',
  parkingSideColors.left,
  '#888888',
] as const

const laneWeight = ['coalesce', ['get', 'weight'], 2]
const laneOffset = ['coalesce', ['get', 'offset'], 0]
const selectedLaneWeight = ['*', selectedLaneScale, laneWeight]
const selectedLaneOffset = ['*', selectedLaneScale, laneOffset]

export { ROUND_LINE_LAYOUT as parkingLineLayout }

export const parkingHitAreaCirclePaint = invisibleHitAreaCirclePaint

export const parkingHitAreaLinePaint = transparentLineHitPaint([
  '+',
  ['*', 2, ['abs', laneOffset]],
  laneWeight,
  HIT_AREA_PADDING,
])

export const parkingCenterlinePaint = {
  'line-color': '#000000',
  'line-width': 1,
  'line-opacity': 1,
} as Record<string, unknown>

export function buildLanePaint(focus: string, hasSelection = false) {
  const color = ['get', 'color']
  const opacity = hasSelection ? laneMutedOpacity : laneActiveOpacity
  if (focus !== 'noSurface') {
    return {
      'line-color': color,
      'line-opacity': opacity,
      'line-width': laneWeight,
      'line-offset': laneOffset,
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(missingSurfaceMatch, color),
    'line-opacity': focusCaseOpacity(missingSurfaceMatch, opacity, laneMutedOpacity),
    'line-width': laneWeight,
    'line-offset': laneOffset,
  } as Record<string, unknown>
}

export function buildSelectedLanePaint(focus: string) {
  if (focus !== 'noSurface') {
    return {
      'line-color': parkingSideLaneColor,
      'line-opacity': laneActiveOpacity,
      'line-width': selectedLaneWeight,
      'line-offset': selectedLaneOffset,
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(missingSurfaceMatch, parkingSideLaneColor),
    'line-opacity': focusCaseOpacity(missingSurfaceMatch, laneActiveOpacity),
    'line-width': selectedLaneWeight,
    'line-offset': selectedLaneOffset,
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
  const color = parkingSideLaneColor
  if (focus !== 'noSurface') {
    return {
      'line-color': color,
      'line-width': selectedLaneWeight,
      'line-offset': selectedLaneOffset,
      'line-opacity': backlightActiveOpacity,
    } as Record<string, unknown>
  }

  return {
    'line-color': focusCaseColor(missingSurfaceMatch, color),
    'line-width': selectedLaneWeight,
    'line-offset': selectedLaneOffset,
    'line-opacity': focusCaseOpacity(missingSurfaceMatch, backlightActiveOpacity),
  } as Record<string, unknown>
}
