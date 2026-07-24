import type OpeningHours from 'opening_hours'
import {
  getOpeningHourseState,
  getOpeningHoursWarnings,
  parseOpeningHours,
  parseOpeningHoursDiagnostics,
} from '../opening-hours'

describe('#parseOpeningHours()', () => {
  test('returns null for null input', () => {
    expect(parseOpeningHours(null)).toBeNull()
  })

  test('parses odd/even day patterns', () => {
    expect(parseOpeningHours('1-31/2')).toBe('odd')
    expect(parseOpeningHours('2-30/2')).toBe('even')
  })

  test('parses Mo-Fr style intervals', () => {
    const interval = parseOpeningHours('Mo-Fr 08:00-18:00')
    expect(interval).not.toBeNull()
    expect(interval).not.toBe('even')
    expect(interval).not.toBe('odd')
    expect(getOpeningHourseState(interval!, new Date('2026-07-24T10:00:00'))).toBe(true)
    expect(getOpeningHourseState(interval!, new Date('2026-07-25T10:00:00'))).toBe(false)
  })

  test('returns null for invalid values', () => {
    expect(parseOpeningHours('invalid garbage')).toBeNull()
  })
})

describe('#parseOpeningHoursDiagnostics()', () => {
  test('returns null for null input', () => {
    expect(parseOpeningHoursDiagnostics(null)).toBeNull()
  })

  test('returns empty diagnostics for odd/even patterns', () => {
    expect(parseOpeningHoursDiagnostics('1-31/2')).toStrictEqual({
      warnings: [],
      error: null,
    })
  })

  test('returns structured warnings for valid intervals', () => {
    const interval = parseOpeningHours('Mo-Fr 08:00-18:00')
    expect(interval).not.toBeNull()

    const diagnostics = parseOpeningHoursDiagnostics('Mo-Fr 08:00-18:00')
    expect(diagnostics?.error).toBeNull()
    expect(diagnostics?.warnings).toStrictEqual(getOpeningHoursWarnings(interval as OpeningHours))
  })

  test('captures parse errors as structured diagnostics', () => {
    const diagnostics = parseOpeningHoursDiagnostics('invalid garbage')
    expect(diagnostics?.warnings).toStrictEqual([])
    expect(diagnostics?.error).toContain('invalid garbage')
  })
})
