import { describe, expect, test } from 'bun:test'
import {
  implicitBoundariesEnabled,
  nextBoundariesFocusState,
  readBoundariesEnabled,
} from '../shell/map/map-focus-state'
import { serializeMapSearch } from '../shell/map/search-schema'

describe('map boundaries focus state', () => {
  test('defaults boundaries on when focus param is absent', () => {
    expect(readBoundariesEnabled(undefined)).toBe(true)
    expect(serializeMapSearch({})).toEqual({})
  })

  test('turns boundaries off when a non-default primary filter is set', () => {
    expect(readBoundariesEnabled({ width: 'car' })).toBe(false)
    expect(serializeMapSearch({ focus: { width: 'car' } })).toEqual({
      focus: 'width:car',
    })
  })

  test('keeps boundaries on when explicitly set with a primary filter', () => {
    expect(readBoundariesEnabled({ width: 'car', boundaries: true })).toBe(true)
    expect(serializeMapSearch({ focus: { width: 'car', boundaries: true } })).toEqual({
      focus: 'width:car,boundaries:true',
    })
  })

  test('serializes boundaries off without a primary filter', () => {
    expect(readBoundariesEnabled({ boundaries: false })).toBe(false)
    expect(serializeMapSearch({ focus: { boundaries: false } })).toEqual({
      focus: 'boundaries:false',
    })
  })

  test('nextBoundariesFocusState omits boundaries when matching implicit default', () => {
    expect(nextBoundariesFocusState(undefined, false)).toEqual({ boundaries: false })
    expect(nextBoundariesFocusState({ width: 'car' }, false)).toEqual({ width: 'car' })
    expect(nextBoundariesFocusState({ width: 'car' }, true)).toEqual({
      width: 'car',
      boundaries: true,
    })
    expect(nextBoundariesFocusState(undefined, true)).toBeUndefined()
  })

  test('implicitBoundariesEnabled follows primary filter presence', () => {
    expect(implicitBoundariesEnabled(undefined)).toBe(true)
    expect(implicitBoundariesEnabled({ boundaries: false })).toBe(true)
    expect(implicitBoundariesEnabled({ width: 'bicycle' })).toBe(false)
  })
})
