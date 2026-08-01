import type { RoadSpaceSlotKind } from './types'

/** SRK Berlin-ish clear-width defaults (metres). Never include paint millimetres. */
export const DEFAULT_WIDTHS_M: Readonly<Record<RoadSpaceSlotKind, number>> = {
  motor: 3.0,
  bus: 3.0,
  cycle: 1.5,
  both_ways: 3.0,
  sidewalk: 2.0,
  shared_path: 2.5,
}

export const DEFAULT_METERS_TO_PX = 20

export const SEGMENT_BAND_HEIGHT_PX = 96

/** Bands stack contiguously so kerbs/separators read as continuous runs. */
export const SEGMENT_GAP_PX = 0

/** Median gap used when spreading a dual carriageway fork. */
export const DEFAULT_MEDIAN_GAP_M = 3.0

/**
 * Fraction of band height used for width-change tapers (kerbs, outer edges, ribbons).
 * Shared so fills and strokes meet on the same diagonal.
 */
export const TAPER_FRAC = 0.45

/** Height fraction for synthetic transition wedges between width-changing segments. */
export const TRANSITION_BAND_HEIGHT_FRAC = 0.6
