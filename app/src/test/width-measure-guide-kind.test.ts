import { describe, expect, test } from 'bun:test'
import { widthMeasureGuideKind } from '../modes/width/domain/width-measure-guide-kind'

describe('widthMeasureGuideKind', () => {
  test('maps sidepath prefixes', () => {
    expect(widthMeasureGuideKind({ prefix: 'sidewalk', tags: { highway: 'residential' } })).toBe(
      'sidewalk',
    )
    expect(widthMeasureGuideKind({ prefix: 'cycleway', tags: { highway: 'residential' } })).toBe(
      'cycleway',
    )
  })

  test('maps centerline highway types', () => {
    expect(widthMeasureGuideKind({ tags: { highway: 'residential' } })).toBe('road')
    expect(widthMeasureGuideKind({ tags: { highway: 'cycleway' } })).toBe('cycleway')
    expect(widthMeasureGuideKind({ tags: { highway: 'footway' } })).toBe('sidewalk')
    expect(widthMeasureGuideKind({ tags: { highway: 'pedestrian' } })).toBe('sidewalk')
    expect(widthMeasureGuideKind({ tags: { highway: 'track' } })).toBe('other')
  })

  test('maps path by access tags', () => {
    expect(widthMeasureGuideKind({ tags: { highway: 'path', bicycle: 'designated' } })).toBe(
      'cycleway',
    )
    expect(widthMeasureGuideKind({ tags: { highway: 'path', foot: 'designated' } })).toBe(
      'sidewalk',
    )
    expect(widthMeasureGuideKind({ tags: { highway: 'path' } })).toBe('sidewalk')
  })
})
