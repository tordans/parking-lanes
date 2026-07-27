import { describe, expect, test } from 'bun:test'
import {
  dominantWayBearing,
  screenOrderedParkingSides,
} from '../modes/parking/domain/way-side-order'
import { screenOrderedSidesSwitcherLabel } from '../modes/parking/side-colors'

describe('dominantWayBearing', () => {
  test('uses longest runs and ignores short curve segments', () => {
    const coordinates: [number, number][] = [
      [13.45, 52.474],
      [13.451, 52.474],
      [13.452, 52.4741],
      [13.453, 52.4742],
      [13.454, 52.4742],
    ]

    const bearingDeg = dominantWayBearing(coordinates)
    expect(bearingDeg).toBeGreaterThan(80)
    expect(bearingDeg).toBeLessThan(100)
  })

  test('returns north for a northbound line', () => {
    const coordinates: [number, number][] = [
      [13.45, 52.47],
      [13.45, 52.48],
    ]
    expect(dominantWayBearing(coordinates)).toBeCloseTo(0, 0)
  })
})

describe('screenOrderedParkingSides', () => {
  const eastbound: [number, number][] = [
    [13.45, 52.474],
    [13.454, 52.474],
  ]

  test('north-up map: eastbound way has left on screen-left', () => {
    expect(screenOrderedParkingSides(eastbound, 0)).toEqual(['left', 'right'])
  })

  test('north-up map: westbound way has right on screen-left', () => {
    const westbound: [number, number][] = [
      [13.454, 52.474],
      [13.45, 52.474],
    ]
    expect(screenOrderedParkingSides(westbound, 0)).toEqual(['right', 'left'])
  })
})

describe('screenOrderedSidesSwitcherLabel', () => {
  test('reflects screen order', () => {
    expect(screenOrderedSidesSwitcherLabel(['left', 'right'])).toBe('Links/Rechts')
    expect(screenOrderedSidesSwitcherLabel(['right', 'left'])).toBe('Rechts/Links')
  })
})
