import { describe, expect, test } from 'bun:test'
import {
  lineOffsetFromMeters,
  lineWidthFromMeters,
  PIXEL_SCALE_GERMANY,
  pixelsFromMeters,
} from '../modes/width/domain/meters-to-pixels'

function assertZoomIsTopLevelInterpolateInput(expr: readonly unknown[]) {
  expect(expr[0]).toBe('interpolate')
  expect(expr[2]).toEqual(['zoom'])
  const asJson = JSON.stringify(expr)
  // Nested zoom usages (outside the top-level input slot) are invalid in MapLibre.
  expect(asJson.match(/\["zoom"\]/g)?.length ?? 0).toBe(1)
}

describe('lineWidthFromMeters', () => {
  test('uses top-level exponential interpolate on zoom', () => {
    const expr = lineWidthFromMeters('roadWidthM')
    assertZoomIsTopLevelInterpolateInput(expr)
    expect(expr[1]).toEqual(['exponential', 2])
  })

  test('extraMeters expands width without nesting zoom', () => {
    const expr = lineWidthFromMeters('roadWidthM', { extraMeters: 4 })
    assertZoomIsTopLevelInterpolateInput(expr)
    expect(JSON.stringify(expr)).toContain('["+",["get","roadWidthM"],4]')
  })

  test('stop outputs match metres→pixels at Germany scale', () => {
    const expr = lineWidthFromMeters('roadWidthM')
    const scale0 = expr[4] as unknown[]
    const scale22 = expr[6] as unknown[]
    expect(scale0[0]).toBe('*')
    expect(scale0[2]).toBeCloseTo(1 / PIXEL_SCALE_GERMANY, 12)
    expect(scale22[2]).toBeCloseTo(2 ** 22 / PIXEL_SCALE_GERMANY, 6)
    expect(pixelsFromMeters(1, 0, 51)).toBeCloseTo(1 / PIXEL_SCALE_GERMANY, 12)
  })
})

describe('lineOffsetFromMeters', () => {
  test('uses top-level exponential interpolate on zoom', () => {
    assertZoomIsTopLevelInterpolateInput(lineOffsetFromMeters('roadWidthM', 0.5))
  })
})
