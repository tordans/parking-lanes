import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_FALLBACK,
  deriveHighwayWidthFallback,
  isOnewayHighway,
} from '../modes/width/domain/highway-width-fallbacks'

describe('isOnewayHighway', () => {
  test('recognises yes, implicit_yes, and car_not_bike', () => {
    expect(isOnewayHighway('yes')).toBe(true)
    expect(isOnewayHighway('implicit_yes')).toBe(true)
    expect(isOnewayHighway('car_not_bike')).toBe(true)
    expect(isOnewayHighway('no')).toBe(false)
    expect(isOnewayHighway(undefined)).toBe(false)
  })
})

describe('deriveHighwayWidthFallback', () => {
  test('uses oneway table for motorways', () => {
    expect(deriveHighwayWidthFallback('motorway', true)).toEqual({
      value: 15,
      source: 'highway_default_and_oneway',
    })
    expect(deriveHighwayWidthFallback('motorway', false)).toEqual({
      value: 22,
      source: 'highway_default',
    })
  })

  test('uses same value for residential regardless of oneway', () => {
    expect(deriveHighwayWidthFallback('residential', true)).toEqual({
      value: 8,
      source: 'highway_default',
    })
  })

  test('covers path, cycleway, and steps', () => {
    expect(deriveHighwayWidthFallback('path', false).value).toBe(2.5)
    expect(deriveHighwayWidthFallback('cycleway', true).value).toBe(2)
    expect(deriveHighwayWidthFallback('steps', false).value).toBe(2)
  })

  test('falls back to default for unknown highway', () => {
    expect(deriveHighwayWidthFallback('unknown_highway', false)).toEqual({
      value: DEFAULT_FALLBACK,
      source: 'highway_default',
    })
  })
})
