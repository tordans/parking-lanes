import type { SidepathPrefix } from '@osm-editor-kit/osm-sidepath-tags'

/** Push sidepath bands slightly outside the carriageway edge. */
export const SURFACE_SIDEPATH_EXTRA_OUTSIDE_M = 1.5

/**
 * Gap between stacked infra on the same side (cycleway then sidewalk).
 * Large enough that band + hitarea widths do not overlap at editor zooms.
 */
export const SURFACE_SIDEPATH_BAND_GAP_M = 5

/** Half-gap between foot and cycle channels on a segregated path. */
export const SURFACE_SEGREGATED_HALF_GAP_M = 1.25

/** Cycleway sits closer to the road; sidewalk is further out. */
const SIDEPATH_STACK_RANK: Record<SidepathPrefix, number> = {
  cycleway: 0,
  sidewalk: 1,
}

/** Unsigned metres from centerline to the band center (sign applied in paint via `side`). */
export function surfaceSidepathOffsetMeters(
  parentRoadWidthM: number,
  prefix: SidepathPrefix,
  prefixesOnSide: readonly SidepathPrefix[],
): number {
  const ranks = [...new Set(prefixesOnSide.map((p) => SIDEPATH_STACK_RANK[p]))].sort(
    (a, b) => a - b,
  )
  const rankIndex = ranks.indexOf(SIDEPATH_STACK_RANK[prefix])
  const stackIndex = rankIndex < 0 ? 0 : rankIndex
  return (
    parentRoadWidthM * 0.5 +
    SURFACE_SIDEPATH_EXTRA_OUTSIDE_M +
    stackIndex * SURFACE_SIDEPATH_BAND_GAP_M
  )
}

export function isSeparateSidepathValue(value: string | undefined): boolean {
  return value === 'separate'
}
