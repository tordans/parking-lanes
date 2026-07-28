import { transparentLineHitPaint } from './map-hit-paint'

/** Shared pink for missing / untagged map data across modes. */
export const MISSING_DATA_PINK = '#ec4899'

export const missingDataCenterlinePaint = {
  'line-color': MISSING_DATA_PINK,
  'line-width': 2,
  'line-opacity': 0.9,
} as Record<string, unknown>

/** Black dotted overlay drawn on top of the pink missing centerline. */
export const missingDataDottedOverlayPaint = {
  'line-color': '#000000',
  'line-width': 2,
  'line-opacity': 0.9,
  'line-dasharray': [0.5, 1.5],
} as Record<string, unknown>

/** Forgiving hit target for thin missing centerlines. */
export const missingDataHitAreaPaint = transparentLineHitPaint(12)
