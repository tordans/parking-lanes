import { describe, expect, it } from 'bun:test'
import type { Segment } from '../domain/types'
import {
  isReversedAtNode,
  normalizeTagsForDirection,
  orientNeighbor,
  swapLeftRightKey,
} from '../traversal/direction'
import { mirrorTags } from '../traversal/mirror-tags'

function makeSegment(id: number, nodeIds: number[], tags: Record<string, string> = {}): Segment {
  return {
    id,
    version: 1,
    nodeIds,
    tags,
    geometry: {
      type: 'LineString',
      coordinates: nodeIds.map((_, i) => [13.0 + i * 0.001, 52.0]),
    },
  }
}

describe('swapLeftRightKey', () => {
  it('swaps left and right in tag keys', () => {
    expect(swapLeftRightKey('cycleway:left:surface')).toBe('cycleway:right:surface')
    expect(swapLeftRightKey('cycleway:right:width')).toBe('cycleway:left:width')
  })
})

describe('isReversedAtNode', () => {
  it('detects when both segments meet at their ends', () => {
    const a = makeSegment(1, [10, 20])
    const b = makeSegment(2, [30, 20])
    expect(isReversedAtNode(a, b, 20)).toBe(true)
  })

  it('detects continuous direction', () => {
    const a = makeSegment(1, [10, 20])
    const b = makeSegment(2, [20, 30])
    expect(isReversedAtNode(a, b, 20)).toBe(false)
  })
})

describe('normalizeTagsForDirection', () => {
  it('swaps left/right tags when reversed', () => {
    const tags = {
      highway: 'cycleway',
      'cycleway:left:surface': 'asphalt',
      'cycleway:right:surface': 'paving_stones',
    }
    const normalized = normalizeTagsForDirection(tags, true)
    expect(normalized['cycleway:left:surface']).toBe('paving_stones')
    expect(normalized['cycleway:right:surface']).toBe('asphalt')
    expect(normalized.highway).toBe('cycleway')
  })

  it('swaps forward/backward and reverses lane pipes when reversed', () => {
    const tags = {
      highway: 'secondary',
      'lanes:forward': '2',
      'lanes:backward': '1',
      'turn:lanes:forward': 'left|through',
      'turn:lanes:backward': 'through',
      oneway: 'yes',
    }
    const normalized = normalizeTagsForDirection(tags, true)
    expect(normalized['lanes:forward']).toBe('1')
    expect(normalized['lanes:backward']).toBe('2')
    expect(normalized['turn:lanes:forward']).toBe('through')
    expect(normalized['turn:lanes:backward']).toBe('through|right')
    expect(normalized.oneway).toBe('-1')
  })
})

describe('mirrorTags', () => {
  it('is self-inverse', () => {
    const tags = {
      highway: 'residential',
      oneway: 'yes',
      lanes: '2',
      'turn:lanes': 'left|through|right',
      placement: 'left_of:1',
      sidewalk: 'left',
      'cycleway:right': 'lane',
    }
    expect(mirrorTags(mirrorTags(tags))).toEqual(tags)
  })

  it('mirrors placement using lane count', () => {
    const tags = { lanes: '4', placement: 'left_of:2' }
    expect(mirrorTags(tags).placement).toBe('right_of:3')
  })

  it('swaps bare side values', () => {
    expect(mirrorTags({ sidewalk: 'left' }).sidewalk).toBe('right')
    expect(mirrorTags({ cycleway: 'right' }).cycleway).toBe('left')
  })
})

describe('orientNeighbor', () => {
  it('reverses geometry and tags when needed', () => {
    const from = makeSegment(1, [10, 20])
    const neighbor = makeSegment(2, [30, 20], {
      'cycleway:left:surface': 'asphalt',
    })
    const oriented = orientNeighbor(neighbor, 20, from)
    expect(oriented.nodeIds).toEqual([20, 30])
    expect(oriented.reversed).toBe(true)
    expect(oriented.tags['cycleway:right:surface']).toBe('asphalt')
  })
})
