import { describe, expect, test } from 'bun:test'
import {
  resolveImpliedOneway,
  resolveImpliedOnewayBicycle,
} from '../modes/lanes/domain/oneway-defaults'

describe('resolveImpliedOneway', () => {
  test('defaults to no when unset', () => {
    expect(resolveImpliedOneway({})).toBe('no')
    expect(resolveImpliedOneway({ junction: 'circular' })).toBe('no')
  })

  test('implies yes for roundabouts', () => {
    expect(resolveImpliedOneway({ junction: 'roundabout' })).toBe('yes')
    expect(resolveImpliedOneway({ junction: 'Roundabout' })).toBe('yes')
  })

  test('ignores explicit oneway tag for the soft default', () => {
    // Soft default is only shown when the tag is empty; helper is independent of oneway=*.
    expect(resolveImpliedOneway({ oneway: 'yes' })).toBe('no')
    expect(resolveImpliedOneway({ oneway: 'no', junction: 'roundabout' })).toBe('yes')
  })
})

describe('resolveImpliedOnewayBicycle', () => {
  test('inherits two-way when oneway is unset', () => {
    expect(resolveImpliedOnewayBicycle({})).toBe('no')
    expect(resolveImpliedOnewayBicycle({ oneway: 'no' })).toBe('no')
  })

  test('inherits yes when oneway=yes', () => {
    expect(resolveImpliedOnewayBicycle({ oneway: 'yes' })).toBe('yes')
    expect(resolveImpliedOnewayBicycle({ oneway: '1' })).toBe('yes')
    expect(resolveImpliedOnewayBicycle({ oneway: '-1' })).toBe('yes')
  })

  test('inherits yes for roundabouts', () => {
    expect(resolveImpliedOnewayBicycle({ junction: 'roundabout' })).toBe('yes')
  })

  test('does not read oneway:bicycle itself', () => {
    // Explicit override is handled by the control value, not the implied helper.
    expect(resolveImpliedOnewayBicycle({ oneway: 'yes', 'oneway:bicycle': 'no' })).toBe('yes')
  })
})
