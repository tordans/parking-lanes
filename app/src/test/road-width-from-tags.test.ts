import { describe, expect, test } from 'bun:test'
import { parseOsmWidth, roadWidthFromTags } from '../modes/width/domain/road-width-from-tags'

describe('parseOsmWidth', () => {
  test('parses metres, centimetres, and kilometres', () => {
    expect(parseOsmWidth('3.5')).toBe(3.5)
    expect(parseOsmWidth('3.5 m')).toBe(3.5)
    expect(parseOsmWidth('350 cm')).toBe(3.5)
    expect(parseOsmWidth('0.0035 km')).toBe(3.5)
  })

  test('rejects unsupported units', () => {
    expect(parseOsmWidth('10 ft')).toBeNull()
  })
})

describe('roadWidthFromTags', () => {
  test('prefers OSM width tag', () => {
    expect(roadWidthFromTags({ highway: 'residential', width: '5.5' })).toEqual({
      value: 5.5,
      confidence: 'high',
      source: 'tag',
    })
  })

  test('derives from highway when width missing', () => {
    expect(roadWidthFromTags({ highway: 'primary', oneway: 'yes' })).toEqual({
      value: 12,
      confidence: 'medium',
      source: 'highway_default_and_oneway',
    })
  })

  test('handles car_not_bike oneway', () => {
    expect(roadWidthFromTags({ highway: 'secondary', oneway: 'car_not_bike' }).value).toBe(9)
  })
})
