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
 * Fraction of band height used for width-change tapers when no synthetic transition
 * band is present (e.g. dual↔plain pocket wedges). Shared so fills and strokes meet.
 */
export const TAPER_FRAC = 0.45

/**
 * Cap on synthetic transition-band height as a fraction of the main segment band
 * (width-change seams scale up toward this; aligned seams stay compact).
 */
export const TRANSITION_BAND_HEIGHT_FRAC = 0.6

/**
 * Height of an implied-junction placeholder band as a fraction of the main segment
 * band (constant — not scaled by width delta).
 */
export const JUNCTION_BAND_HEIGHT_FRAC = 0.5

/** Slight vertical overlap at band seams to hide sub-pixel antialiasing gaps. */
export const SEAM_OVERLAP_PX = 1

/**
 * Lateral overlap of carriageway/sidepath fills under a shared kerb stroke so
 * antialiasing along morphing S-curves never flashes page background.
 */
export const KERB_FILL_OVERLAP_PX = 1

/** Samples along an S-curve edge crossing a transition band (including endpoints). */
export const TRANSITION_CURVE_SAMPLES = 10
