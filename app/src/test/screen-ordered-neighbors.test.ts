import { describe, expect, test } from 'bun:test'
import type { LineString } from 'geojson'
import { screenOrderedChainNeighbors } from '../modes/lanes/domain/screen-ordered-neighbors'

function segment(id: number, coordinates: [number, number][]) {
  return {
    id,
    geometry: { type: 'LineString', coordinates } satisfies LineString,
  }
}

describe('screenOrderedChainNeighbors', () => {
  const center = segment(1, [
    [13.45, 52.47],
    [13.45, 52.475],
  ])
  const south = segment(2, [
    [13.45, 52.465],
    [13.45, 52.47],
  ])
  const north = segment(3, [
    [13.45, 52.475],
    [13.45, 52.48],
  ])

  test('north-up map: south neighbor on left, north on right', () => {
    const ordered = screenOrderedChainNeighbors(south, north, center, 0)
    expect(ordered.left?.id).toBe(2)
    expect(ordered.right?.id).toBe(3)
    expect(ordered.swapped).toBe(false)
  })

  test('north-up map: swaps when prev is north and next is south', () => {
    const ordered = screenOrderedChainNeighbors(north, south, center, 0)
    expect(ordered.left?.id).toBe(2)
    expect(ordered.right?.id).toBe(3)
    expect(ordered.swapped).toBe(true)
  })
})
