import { describe, expect, test } from 'bun:test'
import {
  PHOTO_AGE_COLORS,
  photoAgeCircleColorExpression,
  yearsAgoMs,
} from '../shell/map/photo-age-style'

const FIXED_NOW = Date.UTC(2026, 6, 28)

describe('photo-age-style', () => {
  test('yearsAgoMs subtracts calendar years', () => {
    const twoYears = yearsAgoMs(2, FIXED_NOW)
    const date = new Date(twoYears)
    expect(date.getUTCFullYear()).toBe(2024)
  })

  test('circle color expression uses TILDA stops and colors', () => {
    const expression = photoAgeCircleColorExpression(FIXED_NOW)
    expect(expression[0]).toBe('step')
    expect(expression).toContain(PHOTO_AGE_COLORS.old)
    expect(expression).toContain(PHOTO_AGE_COLORS.mid)
    expect(expression).toContain(PHOTO_AGE_COLORS.current)
    expect(expression).toContain(yearsAgoMs(4, FIXED_NOW))
    expect(expression).toContain(yearsAgoMs(2, FIXED_NOW))
  })
})
