import { describe, expect, test } from 'bun:test'
import {
  expandSidepaths,
  formatSidepathFeatureId,
  nestSideTags,
  parseSidepathFeatureId,
} from '../index'

describe('formatSidepathFeatureId / parseSidepathFeatureId', () => {
  test('round-trips a sidepath ref', () => {
    const ref = {
      osmType: 'way' as const,
      osmId: 123,
      prefix: 'cycleway' as const,
      side: 'left' as const,
    }
    expect(formatSidepathFeatureId(ref)).toBe('way/123/cycleway/left')
    expect(parseSidepathFeatureId('way/123/cycleway/left')).toEqual(ref)
  })

  test('rejects invalid ids', () => {
    expect(parseSidepathFeatureId('way/123')).toBeNull()
    expect(parseSidepathFeatureId('way/123/cycleway')).toBeNull()
    expect(parseSidepathFeatureId('way/0/cycleway/left')).toBeNull()
    expect(parseSidepathFeatureId('node/1/cycleway/left')).toBeNull()
    expect(parseSidepathFeatureId('way/1/both/left')).toBeNull()
  })
})

describe('nestSideTags', () => {
  test('nests width, source:width, note, prefix, and other keys', () => {
    const parent = { highway: 'residential', cycleway: 'lane' }
    const nested = nestSideTags(parent, 'cycleway', 'left', {
      width: '1.5',
      'source:width': 'survey',
      note: 'narrow',
      cycleway: 'track',
      surface: 'asphalt',
    })

    expect(nested).toEqual({
      highway: 'residential',
      cycleway: 'lane',
      'cycleway:left': 'track',
      'cycleway:left:width': '1.5',
      'source:cycleway:left:width': 'survey',
      'note:cycleway:left': 'narrow',
      'cycleway:left:surface': 'asphalt',
    })
  })

  test('deletes keys when patch value is undefined', () => {
    const parent = {
      highway: 'residential',
      'cycleway:right:width': '2',
      'source:cycleway:right:width': 'survey',
    }
    const nested = nestSideTags(parent, 'cycleway', 'right', {
      width: undefined,
      'source:width': undefined,
    })

    expect(nested).toEqual({ highway: 'residential' })
    expect(nested['cycleway:right:width']).toBeUndefined()
  })

  test('does not auto-clean bare or both keys', () => {
    const parent = { highway: 'residential', cycleway: 'lane', 'cycleway:both': 'track' }
    const nested = nestSideTags(parent, 'cycleway', 'left', { width: '1.2' })

    expect(nested.cycleway).toBe('lane')
    expect(nested['cycleway:both']).toBe('track')
    expect(nested['cycleway:left:width']).toBe('1.2')
  })
})

describe('expandSidepaths', () => {
  test('expands bare cycleway=lane into left and right virtuals', () => {
    const expanded = expandSidepaths(42, { highway: 'residential', cycleway: 'lane' })
    expect(expanded).toHaveLength(2)
    expect(expanded.map((entry) => entry.ref.side).sort()).toEqual(['left', 'right'])
    expect(expanded.every((entry) => entry.ref.prefix === 'cycleway')).toBe(true)
    expect(expanded.every((entry) => entry.ref.osmId === 42)).toBe(true)
    expect(expanded[0]?.tags.highway).toBe('cycleway')
    expect(expanded[0]?.tags.cycleway).toBe('lane')
  })

  test('expands cycleway:both into left and right virtuals', () => {
    const expanded = expandSidepaths(7, { highway: 'primary', 'cycleway:both': 'track' })
    expect(expanded.map((entry) => entry.ref.side).sort()).toEqual(['left', 'right'])
  })

  test('keeps a single side when only one side is tagged', () => {
    const expanded = expandSidepaths(9, {
      highway: 'residential',
      'cycleway:left': 'lane',
      'cycleway:left:width': '1.5',
    })

    expect(expanded).toHaveLength(1)
    expect(expanded[0]?.ref).toEqual({
      osmType: 'way',
      osmId: 9,
      prefix: 'cycleway',
      side: 'left',
    })
    expect(expanded[0]?.tags.width).toBe('1.5')
  })

  test('expands sidewalk sidepaths with footway highway', () => {
    const expanded = expandSidepaths(11, { highway: 'residential', sidewalk: 'both' })
    expect(expanded).toHaveLength(2)
    expect(expanded.every((entry) => entry.ref.prefix === 'sidewalk')).toBe(true)
    expect(expanded[0]?.tags.highway).toBe('footway')
  })

  test('does not split path-like parents', () => {
    const expanded = expandSidepaths(99, { highway: 'cycleway', cycleway: 'track' })
    expect(expanded).toEqual([])
  })
})
