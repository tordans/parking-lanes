import { describe, expect, test } from 'bun:test'
import { isMissingSurfaceForSide } from '../modes/parking/domain/missing-surface'

describe('isMissingSurfaceForSide', () => {
  test('is false when parking value does not need surface', () => {
    expect(isMissingSurfaceForSide({ 'parking:right': 'no' }, 'right')).toBe(false)
    expect(isMissingSurfaceForSide({ 'parking:left': 'parallel' }, 'left')).toBe(false)
  })

  test('is true when side needs surface but tag is missing', () => {
    expect(isMissingSurfaceForSide({ 'parking:right': 'lane' }, 'right')).toBe(true)
    expect(isMissingSurfaceForSide({ 'parking:left': 'street_side' }, 'left')).toBe(true)
    expect(isMissingSurfaceForSide({ 'parking:right': 'yes' }, 'right')).toBe(true)
  })

  test('is false when side or both surface tag is present', () => {
    expect(
      isMissingSurfaceForSide(
        { 'parking:right': 'lane', 'parking:right:surface': 'asphalt' },
        'right',
      ),
    ).toBe(false)
    expect(
      isMissingSurfaceForSide(
        { 'parking:left': 'lane', 'parking:both:surface': 'paving_stones' },
        'left',
      ),
    ).toBe(false)
  })

  test('falls back to parking:both for value and surface checks', () => {
    expect(isMissingSurfaceForSide({ 'parking:both': 'on_kerb' }, 'left')).toBe(true)
    expect(
      isMissingSurfaceForSide(
        { 'parking:both': 'on_kerb', 'parking:both:surface': 'gravel' },
        'right',
      ),
    ).toBe(false)
  })

  test('evaluates left and right independently', () => {
    expect(
      isMissingSurfaceForSide(
        { 'parking:left': 'lane', 'parking:right': 'no', 'parking:left:surface': 'asphalt' },
        'left',
      ),
    ).toBe(false)
    expect(
      isMissingSurfaceForSide(
        { 'parking:left': 'lane', 'parking:right': 'no', 'parking:left:surface': 'asphalt' },
        'right',
      ),
    ).toBe(false)
  })
})
