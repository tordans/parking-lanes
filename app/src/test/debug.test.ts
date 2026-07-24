import { describe, expect, test } from 'bun:test'
import {
  canShowDebugToggle,
  colorForGroupId,
  isDebugUser,
  parseDebugSearch,
} from '../parking/debug'
import { mapSearchSchema } from '../parking/map/search-schema'

describe('parseDebugSearch', () => {
  test('accepts true and string literals', () => {
    expect(parseDebugSearch(true)).toBe(true)
    expect(parseDebugSearch('1')).toBe(true)
    expect(parseDebugSearch('true')).toBe(true)
    expect(parseDebugSearch(false)).toBe(false)
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

  test('shows toggle for allowlisted users or active debug', () => {
    expect(canShowDebugToggle('tordans', false)).toBe(true)
    expect(canShowDebugToggle('other', false)).toBe(false)
    expect(canShowDebugToggle('other', true)).toBe(true)
  })
})

describe('colorForGroupId', () => {
  test('returns stable colors per group', () => {
    expect(colorForGroupId('group-a')).toBe(colorForGroupId('group-a'))
    expect(colorForGroupId('group-a')).not.toBe(colorForGroupId('group-b'))
  })
})

describe('mapSearchSchema', () => {
  test('coerces debug search param to boolean', () => {
    expect(mapSearchSchema.parse({ debug: '1' }).debug).toBe(true)
    expect(mapSearchSchema.parse({ debug: 'true' }).debug).toBe(true)
    expect(mapSearchSchema.parse({ debug: '0' }).debug).toBe(false)
    expect(mapSearchSchema.parse({}).debug).toBeUndefined()
  })
})
