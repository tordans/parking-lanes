import { describe, expect, test } from 'bun:test'
import { isWidthModeLinkWay } from '../modes/width/domain/width-link-filter'

describe('isWidthModeLinkWay', () => {
  test('matches highway=*_link', () => {
    expect(isWidthModeLinkWay({ highway: 'motorway_link' })).toBe(true)
    expect(isWidthModeLinkWay({ highway: 'primary_link' })).toBe(true)
    expect(isWidthModeLinkWay({ highway: 'cycleway_link' })).toBe(true)
  })

  test('matches cycleway=link and footway=link', () => {
    expect(isWidthModeLinkWay({ highway: 'cycleway', cycleway: 'link' })).toBe(true)
    expect(isWidthModeLinkWay({ highway: 'footway', footway: 'link' })).toBe(true)
  })

  test('keeps normal highways', () => {
    expect(isWidthModeLinkWay({ highway: 'residential' })).toBe(false)
    expect(isWidthModeLinkWay({ highway: 'cycleway' })).toBe(false)
    expect(isWidthModeLinkWay({ highway: 'primary', cycleway: 'lane' })).toBe(false)
  })
})
