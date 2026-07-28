import { describe, expect, test } from 'bun:test'
import { canShowDebugToggle, colorForGroupId, isDebugUser, parseDebugSearch } from '../shell/debug'
import { mapSearchSchema, serializeMapSearch } from '../shell/map/search-schema'

describe('parseDebugSearch', () => {
  test('accepts boolean, number, and string literals', () => {
    expect(parseDebugSearch(true)).toBe(true)
    expect(parseDebugSearch(1)).toBe(true)
    expect(parseDebugSearch('1')).toBe(true)
    expect(parseDebugSearch('true')).toBe(true)
    expect(parseDebugSearch(false)).toBe(false)
    expect(parseDebugSearch(0)).toBe(false)
    expect(parseDebugSearch('0')).toBe(false)
    expect(parseDebugSearch('false')).toBe(false)
    expect(parseDebugSearch(undefined)).toBeUndefined()
  })
})

describe('debug enablement helpers', () => {
  test('allowlists configured users', () => {
    expect(isDebugUser('tordans')).toBe(true)
    expect(isDebugUser('other')).toBe(false)
    expect(isDebugUser(null)).toBe(false)
  })

  test('shows toggle in Vite DEV or for allowlisted users', () => {
    // Bun test does not set Vite's import.meta.env.DEV to true.
    expect(import.meta.env.DEV === true).toBe(false)
    expect(canShowDebugToggle('tordans')).toBe(true)
    expect(canShowDebugToggle('other')).toBe(false)
    expect(canShowDebugToggle(null)).toBe(false)
  })
})

describe('colorForGroupId', () => {
  test('returns stable colors per group', () => {
    expect(colorForGroupId('group-a')).toBe(colorForGroupId('group-a'))
    expect(colorForGroupId('group-a')).not.toBe(colorForGroupId('group-b'))
  })
})

describe('mapSearchSchema', () => {
  test('serializeMapSearch omits empty fields', () => {
    expect(serializeMapSearch({})).toEqual({})
    expect(
      serializeMapSearch({
        debug: true,
      }),
    ).toEqual({ debug: true })
  })

  test('serializeMapSearch omits default focus values', () => {
    expect(serializeMapSearch({ focus: { parking: 'all', width: 'all' } })).toEqual({})
    expect(serializeMapSearch({ focus: { parking: 'noSurface' } })).toEqual({
      focus: { parking: 'noSurface' },
    })
    expect(serializeMapSearch({ focus: { width: 'bicycle' } })).toEqual({
      focus: { width: 'bicycle' },
    })
    expect(serializeMapSearch({ focus: { surface: 'bike' } })).toEqual({
      focus: { surface: 'bike' },
    })
  })

  test('serializeMapSearch omits default highway inclusion style', () => {
    expect(serializeMapSearch({ ways: 'public' })).toEqual({})
    expect(serializeMapSearch({ ways: 'inclusive' })).toEqual({ ways: 'inclusive' })
  })

  test('serializeMapSearch omits default locale (en)', () => {
    expect(serializeMapSearch({ locale: 'en' })).toEqual({})
    expect(serializeMapSearch({ locale: 'de' })).toEqual({ locale: 'de' })
  })

  test('parses locale search param (iD-compatible)', () => {
    expect(mapSearchSchema.parse({ locale: 'de' }).locale).toBe('de')
    expect(mapSearchSchema.parse({ locale: 'en' }).locale).toBe('en')
    expect(mapSearchSchema.parse({ locale: 'fr' }).locale).toBeUndefined()
    expect(mapSearchSchema.parse({}).locale).toBeUndefined()
  })

  test('parses focus search param', () => {
    expect(
      mapSearchSchema.parse({
        focus: { parking: 'noSurface', width: 'car' },
      }).focus,
    ).toEqual({ parking: 'noSurface', width: 'car' })
  })

  test('coerces debug search param to boolean', () => {
    expect(mapSearchSchema.parse({ debug: 1 }).debug).toBe(true)
    expect(mapSearchSchema.parse({ debug: '1' }).debug).toBe(true)
    expect(mapSearchSchema.parse({ debug: 'true' }).debug).toBe(true)
    expect(mapSearchSchema.parse({ debug: 0 }).debug).toBe(false)
    expect(mapSearchSchema.parse({ debug: '0' }).debug).toBe(false)
    expect(mapSearchSchema.parse({}).debug).toBeUndefined()
  })
})

describe('mode slug helpers', () => {
  test('parseModeSlug accepts known modes and defaults unknown', async () => {
    const { parseModeSlug, isStreetSpaceModeId } = await import('../shell/map/mode-params')
    expect(isStreetSpaceModeId('width')).toBe(true)
    expect(isStreetSpaceModeId('nope')).toBe(false)
    expect(parseModeSlug('width')).toBe('width')
    expect(parseModeSlug('nope')).toBe('parking')
    expect(parseModeSlug(undefined)).toBe('parking')
  })
})
