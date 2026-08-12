import type { ExpressionSpecification } from 'maplibre-gl'

/** TILDA Mapillary age palette (relative to “now”). */
export const PHOTO_AGE_COLORS = {
  current: '#05CB63', // ≤ 2 years
  mid: '#FFC01B', // 2–4 years
  old: '#F77E5E', // ≥ 4 years
} as const

export type PhotoAgeBucketId = keyof typeof PHOTO_AGE_COLORS

export const PHOTO_AGE_LEGEND: { id: PhotoAgeBucketId; color: string }[] = [
  { id: 'current', color: PHOTO_AGE_COLORS.current },
  { id: 'mid', color: PHOTO_AGE_COLORS.mid },
  { id: 'old', color: PHOTO_AGE_COLORS.old },
]

/** Calendar years ago from `now`, matching TILDA `setFullYear(getFullYear() - N)`. */
export function yearsAgoMs(years: number, nowMs: number = Date.now()): number {
  const date = new Date(nowMs)
  date.setFullYear(date.getFullYear() - years)
  return date.getTime()
}

/**
 * MapLibre `circle-color` / fill color by `capturedAt` (ms), relative to now.
 * Same stops as TILDA `subcat_mapillaryCoverage` age style.
 */
export function photoAgeCircleColorExpression(nowMs: number = Date.now()): ExpressionSpecification {
  return [
    'step',
    ['coalesce', ['get', 'capturedAt'], 0],
    PHOTO_AGE_COLORS.old,
    yearsAgoMs(4, nowMs),
    PHOTO_AGE_COLORS.mid,
    yearsAgoMs(2, nowMs),
    PHOTO_AGE_COLORS.current,
  ]
}
