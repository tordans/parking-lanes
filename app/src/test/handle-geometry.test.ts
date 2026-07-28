import { describe, expect, test } from 'bun:test'
import {
  addHandleFractionUnlessOverlap,
  fractionAlongLine,
  handleCountForLength,
  handleFractionsForLength,
  widthDeltaFromScreenDrag,
} from '../modes/width/domain/handle-geometry'

describe('handleCountForLength', () => {
  test('returns 1, 2, or 3 handles by length thresholds', () => {
    expect(handleCountForLength(20)).toBe(1)
    expect(handleCountForLength(29.9)).toBe(1)
    expect(handleCountForLength(30)).toBe(2)
    expect(handleCountForLength(80)).toBe(2)
    expect(handleCountForLength(80.1)).toBe(3)
    expect(handleCountForLength(200)).toBe(3)
  })
})

describe('handleFractionsForLength', () => {
  test('places handles at mid, ends, or start/mid/end', () => {
    expect(handleFractionsForLength(20)).toEqual([0.5])
    expect(handleFractionsForLength(50)).toEqual([0.15, 0.85])
    expect(handleFractionsForLength(120)).toEqual([0.05, 0.5, 0.95])
  })
})

describe('fractionAlongLine', () => {
  test('projects a click halfway up a northbound line to 0.5', () => {
    const coordinates = [
      [13.4, 52.5],
      [13.4, 52.501],
    ]
    expect(fractionAlongLine(coordinates, { lng: 13.4, lat: 52.5005 })).toBeCloseTo(0.5, 3)
  })
})

describe('addHandleFractionUnlessOverlap', () => {
  test('inserts a new fraction in sorted order', () => {
    expect(addHandleFractionUnlessOverlap([0.15, 0.85], 0.5, 100)).toEqual([0.15, 0.5, 0.85])
  })

  test('skips fractions that would overlap an existing handle', () => {
    expect(addHandleFractionUnlessOverlap([0.15, 0.85], 0.2, 100)).toEqual([0.15, 0.85])
  })
})

describe('widthDeltaFromScreenDrag', () => {
  test('dragging right edge east on northbound road increases width by 2× projected metres', () => {
    // alongBearing 0 = north; right outward = east = +X screen
    const delta = widthDeltaFromScreenDrag({
      deltaX: 10,
      deltaY: 0,
      side: 'right',
      alongBearing: 0,
      mapBearing: 0,
      metersPerPixel: 0.5,
    })
    expect(delta).toBeCloseTo(10, 5)
  })

  test('parallel drag along the road does not change width', () => {
    const delta = widthDeltaFromScreenDrag({
      deltaX: 0,
      deltaY: -20,
      side: 'right',
      alongBearing: 0,
      mapBearing: 0,
      metersPerPixel: 1,
    })
    expect(delta).toBeCloseTo(0, 5)
  })
})
