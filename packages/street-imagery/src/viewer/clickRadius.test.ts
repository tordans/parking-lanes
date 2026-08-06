import { describe, expect, it } from 'bun:test'
import { clickRadiusMeters, haversineDistanceMeters } from './clickRadius'

describe('haversineDistanceMeters', () => {
  it('returns ~0 for identical points', () => {
    expect(haversineDistanceMeters(13.4, 52.5, 13.4, 52.5)).toBe(0)
  })

  it('computes a plausible Berlin distance', () => {
    const distance = haversineDistanceMeters(13.405, 52.52, 13.38, 52.522)
    expect(distance).toBeGreaterThan(1_500)
    expect(distance).toBeLessThan(2_500)
  })
})

describe('clickRadiusMeters', () => {
  it('uses ~50 m at zoom 14', () => {
    expect(clickRadiusMeters(14)).toBe(50)
  })

  it('doubles radius when zooming out one level', () => {
    expect(clickRadiusMeters(13)).toBe(100)
  })

  it('halves radius when zooming in one level', () => {
    expect(clickRadiusMeters(15)).toBe(25)
  })
})
