import { describe, expect, it } from 'bun:test'
import {
  isClutterAccessWay,
  isEditableRoadLikeHighway,
  matchesHighwayInclusionStyle,
  overpassRoadLikeSelector,
} from '../highway-filter'

describe('isClutterAccessWay', () => {
  it('flags private access and low-priority service roads', () => {
    expect(isClutterAccessWay({ highway: 'service', service: 'driveway' })).toBe(true)
    expect(isClutterAccessWay({ highway: 'service', service: 'emergency_access' })).toBe(true)
    expect(isClutterAccessWay({ highway: 'service', service: 'parking_aisle' })).toBe(true)
    expect(isClutterAccessWay({ highway: 'residential', access: 'private' })).toBe(true)
  })

  it('allows ordinary public roads', () => {
    expect(isClutterAccessWay({ highway: 'residential' })).toBe(false)
    expect(isClutterAccessWay({ highway: 'service', service: 'alley' })).toBe(false)
  })
})

describe('matchesHighwayInclusionStyle', () => {
  it('excludes clutter ways in the public default style', () => {
    expect(matchesHighwayInclusionStyle({ highway: 'service', service: 'driveway' })).toBe(false)
    expect(matchesHighwayInclusionStyle({ highway: 'residential' })).toBe(true)
  })

  it('includes clutter ways in the inclusive style', () => {
    expect(
      matchesHighwayInclusionStyle({ highway: 'service', service: 'driveway' }, 'inclusive'),
    ).toBe(true)
  })
})

describe('isEditableRoadLikeHighway', () => {
  it('requires both road-like type and public inclusion', () => {
    expect(isEditableRoadLikeHighway({ highway: 'residential' })).toBe(true)
    expect(isEditableRoadLikeHighway({ highway: 'footway' })).toBe(false)
    expect(isEditableRoadLikeHighway({ highway: 'service', service: 'driveway' })).toBe(false)
  })
})

describe('overpassRoadLikeSelector', () => {
  it('adds clutter exclusions for the public default', () => {
    expect(overpassRoadLikeSelector()).toContain('[access!=private]')
    expect(overpassRoadLikeSelector('inclusive')).not.toContain('[access!=private]')
  })
})
