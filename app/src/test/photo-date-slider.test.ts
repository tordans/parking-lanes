import { describe, expect, test } from 'bun:test'
import { formatPhotoFilterDate } from '../shell/map/format-photo-filter-date'
import {
  capturedAtMsToSliderValue,
  defaultPhotoFromIso,
  fromDateToSliderValue,
  isoDateInTimeZone,
  parseIsoDateInTimeZoneMs,
  photoCaptureTimesToSliderTicks,
  resolvePhotoDateFilter,
  sliderValueToFromDate,
} from '../shell/map/photo-date-slider'
import {
  parsePhotoDateParam,
  serializePhotoDateParam,
} from '../shell/map/street-imagery-search-params'

const FIXED_NOW = Date.UTC(2026, 6, 28, 12, 0, 0) // 2026-07-28 noon UTC
const TZ = 'Europe/Berlin'

describe('formatPhotoFilterDate', () => {
  test('formats ISO calendar days with short numeric locale pattern (de)', () => {
    expect(formatPhotoFilterDate('2025-05-10', 'de', TZ)).toBe('10.05.2025')
  })

  test('formats ISO calendar days with short numeric locale pattern (en)', () => {
    expect(formatPhotoFilterDate('2025-05-10', 'en', 'America/New_York')).toBe('05/10/2025')
  })
})

describe('resolvePhotoDateFilter', () => {
  test('defaults to 3 years when photos are on and photoDate is omitted', () => {
    expect(resolvePhotoDateFilter(undefined, true, FIXED_NOW, TZ)).toEqual({
      from: defaultPhotoFromIso(FIXED_NOW, TZ),
    })
  })

  test('photoDate=all clears the date filter', () => {
    expect(resolvePhotoDateFilter({ all: true }, true, FIXED_NOW, TZ)).toBeUndefined()
  })

  test('photos off → no date filter', () => {
    expect(resolvePhotoDateFilter(undefined, false, FIXED_NOW, TZ)).toBeUndefined()
  })

  test('explicit from/to is preserved', () => {
    expect(
      resolvePhotoDateFilter({ from: '2024-01-01', to: '2025-01-01' }, true, FIXED_NOW, TZ),
    ).toEqual({ from: '2024-01-01', to: '2025-01-01' })
  })
})

describe('photoDate=all search param', () => {
  test('parses and serializes all', () => {
    expect(parsePhotoDateParam('all')).toEqual({ all: true })
    expect(serializePhotoDateParam({ all: true })).toBe('all')
  })
})

describe('photo-date-slider', () => {
  test('all-photos thumb (≈1) clears from date', () => {
    expect(sliderValueToFromDate(1, FIXED_NOW, TZ)).toBeUndefined()
    expect(sliderValueToFromDate(0.999, FIXED_NOW, TZ)).toBeUndefined()
  })

  test('mid slider yields an ISO from date in the past', () => {
    const from = sliderValueToFromDate(0.5, FIXED_NOW, TZ)
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(from! < isoDateInTimeZone(FIXED_NOW, TZ)).toBe(true)
  })

  test('round-trips from date through slider value', () => {
    const from = '2024-01-15'
    const slider = fromDateToSliderValue(from, FIXED_NOW, TZ)
    expect(slider).toBeGreaterThan(0)
    expect(slider).toBeLessThan(1)
    const back = sliderValueToFromDate(slider, FIXED_NOW, TZ)
    expect(back).toBeDefined()
    const deltaDays =
      Math.abs(parseIsoDateInTimeZoneMs(back!, TZ) - parseIsoDateInTimeZoneMs(from, TZ)) /
      86_400_000
    expect(deltaDays).toBeLessThan(14)
  })

  test('absent from date maps to slider = 1', () => {
    expect(fromDateToSliderValue(undefined, FIXED_NOW, TZ)).toBe(1)
  })

  test('default 3-year from sits between today and all on the slider', () => {
    const from = defaultPhotoFromIso(FIXED_NOW, TZ)
    const slider = fromDateToSliderValue(from, FIXED_NOW, TZ)
    expect(slider).toBeGreaterThan(0.2)
    expect(slider).toBeLessThan(0.9)
  })
})

describe('photoCaptureTimesToSliderTicks', () => {
  test('always includes endpoints 0 and 1', () => {
    expect(photoCaptureTimesToSliderTicks([], FIXED_NOW)).toEqual([0, 1])
  })

  test('maps capture times onto the iD age scale (3dp)', () => {
    const threeYearsAgo = FIXED_NOW - 3 * 365.25 * 86_400_000
    const ticks = photoCaptureTimesToSliderTicks([threeYearsAgo, null, Number.NaN], FIXED_NOW)
    expect(ticks[0]).toBe(0)
    expect(ticks.at(-1)).toBe(1)
    expect(ticks).toContain(capturedAtMsToSliderValue(threeYearsAgo, FIXED_NOW))
    expect(capturedAtMsToSliderValue(threeYearsAgo, FIXED_NOW)).toBeGreaterThan(0)
    expect(capturedAtMsToSliderValue(threeYearsAgo, FIXED_NOW)).toBeLessThan(1)
  })
})
