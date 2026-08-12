import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { browserTimeZone } from './format-photo-filter-date'
import type { PhotoDateSearch } from './street-imagery-search-params'

/** Default street-imagery freshness window when photos are on and URL omits `photoDate`. */
export const DEFAULT_PHOTO_FROM_YEARS = 3

/** Calendar `yyyy-MM-dd` for `ms` in `timeZone` (not UTC slice — matches local “day”). */
export function isoDateInTimeZone(ms: number, timeZone: string = browserTimeZone()): string {
  return format(new TZDate(ms, timeZone), 'yyyy-MM-dd')
}

/** Start-of-day ms for a stored `yyyy-MM-dd` in `timeZone`. */
export function parseIsoDateInTimeZoneMs(
  isoDate: string,
  timeZone: string = browserTimeZone(),
): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new TZDate(year!, month! - 1, day!, 0, 0, 0, timeZone).getTime()
}

/** ISO `from` date for the default N-year freshness window. */
export function defaultPhotoFromIso(
  nowMs: number = Date.now(),
  timeZone: string = browserTimeZone(),
  years: number = DEFAULT_PHOTO_FROM_YEARS,
): string {
  const date = new TZDate(nowMs, timeZone)
  date.setFullYear(date.getFullYear() - years)
  return format(date, 'yyyy-MM-dd')
}

/**
 * Effective capture-date filter for map layers.
 * - photos off → no filter
 * - `photoDate=all` → no filter
 * - explicit from/to → as given
 * - omitted → default {@link DEFAULT_PHOTO_FROM_YEARS} years
 */
export function resolvePhotoDateFilter(
  photoDate: PhotoDateSearch | undefined,
  photosEnabled: boolean,
  nowMs: number = Date.now(),
  timeZone: string = browserTimeZone(),
): PhotoDateSearch | undefined {
  if (!photosEnabled) return undefined
  if (photoDate?.all) return undefined
  if (photoDate?.from || photoDate?.to) {
    return { from: photoDate.from, to: photoDate.to }
  }
  return { from: defaultPhotoFromIso(nowMs, timeZone) }
}

/** iD age-slider math: maps 0..1 ↔ capture freshness over ~10 years (power 1.45). */

const TEN_YEARS_MS = 10 * 365.25 * 86_400_000
const SLIDER_POWER = 1.45

/** Map a capture timestamp to the iD slider scale (0 = today, 1 = ~10y / “all”). */
export function capturedAtMsToSliderValue(
  capturedAtMs: number,
  nowMs: number = Date.now(),
): number {
  const ageMs = Math.max(0, nowMs - capturedAtMs)
  return Math.min(1, Math.round(1000 * Math.pow(ageMs / TEN_YEARS_MS, 1 / SLIDER_POWER)) / 1000)
}

/**
 * Tick marks for `<input type="range" list=…>` — same as iD’s photo-overlay datalist:
 * one option per distinct capture age in the viewport, plus endpoints 0 and 1.
 */
export function photoCaptureTimesToSliderTicks(
  capturedAtMsList: Iterable<number | null | undefined>,
  nowMs: number = Date.now(),
): number[] {
  const ticks = new Set<number>([0, 1])
  for (const ms of capturedAtMsList) {
    if (ms == null || !Number.isFinite(ms)) continue
    ticks.add(capturedAtMsToSliderValue(ms, nowMs))
  }
  return [...ticks].sort((a, b) => a - b)
}

/** Slider 0 = today, 1 = ~10y ago / “all”. Matches iD `dateSliderValue('from')`. */
export function fromDateToSliderValue(
  fromIso: string | undefined,
  nowMs: number = Date.now(),
  timeZone: string = browserTimeZone(),
): number {
  if (!fromIso) return 1
  const ageMs = Math.max(0, nowMs - parseIsoDateInTimeZoneMs(fromIso, timeZone))
  return Math.min(1, Math.pow(ageMs / TEN_YEARS_MS, 1 / SLIDER_POWER))
}

/**
 * Convert slider value to ISO `from` date, or `undefined` when the slider means “all photos”
 * (value near 1). Matches iD `setYearFilter(..., 'from')`.
 */
export function sliderValueToFromDate(
  sliderValue: number,
  nowMs: number = Date.now(),
  timeZone: string = browserTimeZone(),
): string | undefined {
  // iD nudges slightly so the max thumb clears the filter.
  const value = sliderValue + 0.001
  if (!(value < 1 && value > 0)) return undefined
  const ms = nowMs - Math.pow(value, SLIDER_POWER) * TEN_YEARS_MS
  return isoDateInTimeZone(ms, timeZone)
}
