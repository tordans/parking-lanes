import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_FALLBACK,
  deriveHighwayWidthFallback,
  isOnewayFromOsmTags,
} from '../modes/width/domain/highway-width-fallbacks'

describe('isOnewayFromOsmTags', () => {
  test('recognises explicit oneway tags', () => {
    expect(isOnewayFromOsmTags({ oneway: 'yes' })).toBe(true)
    expect(isOnewayFromOsmTags({ oneway: '-1' })).toBe(true)
    expect(isOnewayFromOsmTags({ oneway: 'no' })).toBe(false)
    expect(isOnewayFromOsmTags({})).toBe(false)
  })

  test('recognises implicit oneway from highway and junction', () => {
    expect(isOnewayFromOsmTags({ highway: 'motorway' })).toBe(true)
    expect(isOnewayFromOsmTags({ highway: 'motorway_link' })).toBe(true)
    expect(isOnewayFromOsmTags({ junction: 'roundabout', highway: 'secondary' })).toBe(true)
    expect(isOnewayFromOsmTags({ highway: 'motorway', oneway: 'no' })).toBe(false)
  })

  test('recognises car-only oneway when bicycles may use both directions', () => {
    expect(
      isOnewayFromOsmTags({ oneway: 'yes', 'oneway:bicycle': 'no', highway: 'secondary' }),
    ).toBe(true)
    expect(
      isOnewayFromOsmTags({ oneway: '-1', 'oneway:bicycle': 'no', highway: 'secondary' }),
    ).toBe(true)
    expect(isOnewayFromOsmTags({ oneway: 'no', 'oneway:bicycle': 'no' })).toBe(false)
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
