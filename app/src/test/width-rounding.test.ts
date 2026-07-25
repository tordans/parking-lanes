import { describe, expect, test } from 'bun:test'
import { formatWidthTag, roundWidthMetres } from '../modes/width/map/width-osm-edits'

describe('roundWidthMetres', () => {
  test('rounds to 10 cm', () => {
    expect(roundWidthMetres(5.24)).toBe(5.2)
    expect(roundWidthMetres(5.25)).toBe(5.3)
    expect(roundWidthMetres(5)).toBe(5)
    expect(roundWidthMetres(5.01)).toBe(5)
  })
})

describe('formatWidthTag', () => {
  test('writes at most one decimal place', () => {
    expect(formatWidthTag(5.24)).toBe('5.2')
    expect(formatWidthTag(5)).toBe('5')
    expect(formatWidthTag(5.0)).toBe('5')
  })
})
