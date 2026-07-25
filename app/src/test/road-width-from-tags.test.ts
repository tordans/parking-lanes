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
      source: 'width',
      kind: 'explicit',
    })
  })

  test('uses est_width when width is missing', () => {
    expect(roadWidthFromTags({ highway: 'residential', est_width: '4.2' })).toEqual({
      value: 4.2,
      confidence: 'high',
      source: 'est_width',
      kind: 'explicit',
    })
  })

  test('prefers width over est_width', () => {
    expect(roadWidthFromTags({ highway: 'residential', width: '5', est_width: '4' }).source).toBe(
      'width',
    )
  })

  test('derives from highway when width missing', () => {
    expect(roadWidthFromTags({ highway: 'primary', oneway: 'yes' })).toEqual({
      value: 12,
      confidence: 'medium',
      source: 'highway_default_and_oneway',
      kind: 'default',
    })
  })

  test('uses oneway table for car-only oneway roads', () => {
    expect(
      roadWidthFromTags({
        highway: 'secondary',
        oneway: 'yes',
        'oneway:bicycle': 'no',
      }).value,
    ).toBe(9)
  })

  test('uses oneway table for implicit motorway oneway', () => {
    expect(roadWidthFromTags({ highway: 'motorway' }).value).toBe(15)
  })
})
