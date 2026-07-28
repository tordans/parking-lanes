import { transparentLineHitPaint } from './map-hit-paint'
import { selectedWayCenterlinePaint } from './selected-way-centerline-paint'

/** Shared pink for missing / untagged map data across modes. */
export const MISSING_DATA_PINK = '#ec4899'

const hairlineWidth = selectedWayCenterlinePaint['line-width'] as number

/** Pink centerline — twice the black selection hairline, no dotted overlay. */
export const missingDataCenterlinePaint = {
  'line-color': MISSING_DATA_PINK,
  'line-width': hairlineWidth * 2,
  'line-opacity': 0.9,
} as Record<string, unknown>

/** Forgiving hit target for thin missing centerlines. */
export const missingDataHitAreaPaint = transparentLineHitPaint(12)
