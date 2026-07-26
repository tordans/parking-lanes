import { describe, expect, it } from 'bun:test'
import type { Segment } from '../domain/types'
import { isRoadLikeHighway } from '../highway-filter'
import {
  filterNeighborCandidates,
  getEndpointNodeId,
  pickBestNeighbor,
  sameKind,
} from '../traversal/neighborMatch'

function makeSegment(
  id: number,
  nodeIds: number[],
  tags: Record<string, string> = { highway: 'primary' },
): Segment {
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

describe('sameKind', () => {
  it('matches segments with same highway tag', () => {
    const a = makeSegment(1, [1, 2], { highway: 'cycleway' })
    const b = makeSegment(2, [2, 3], { highway: 'cycleway' })
    expect(sameKind(a, b)).toBe(true)
  })

  it('rejects different highway values', () => {
    const a = makeSegment(1, [1, 2], { highway: 'primary' })
    const b = makeSegment(2, [2, 3], { highway: 'secondary' })
    expect(sameKind(a, b)).toBe(false)
  })
})

describe('filterNeighborCandidates', () => {
  it('filters to ways touching the forward endpoint', () => {
    const from = makeSegment(1, [10, 20])
    const touching = makeSegment(2, [20, 30])
    const notTouching = makeSegment(3, [40, 50])
    const result = filterNeighborCandidates(from, [from, touching, notTouching], 'forward')
    expect(result.map((s) => s.id)).toEqual([2])
  })

  it('prefers same kind at junction', () => {
    const from = makeSegment(1, [10, 20], { highway: 'cycleway' })
    const cycleway = makeSegment(2, [20, 30], { highway: 'cycleway' })
    const footway = makeSegment(3, [20, 40], { highway: 'footway' })
    const result = filterNeighborCandidates(from, [cycleway, footway], 'forward')
    expect(result.map((s) => s.id)).toEqual([2])
  })

  it('applies candidate filter when provided', () => {
    const from = makeSegment(1, [10, 20], { highway: 'primary' })
    const road = makeSegment(2, [20, 30], { highway: 'primary' })
    const footway = makeSegment(3, [20, 40], { highway: 'footway' })
    const result = filterNeighborCandidates(from, [road, footway], 'forward', (segment) =>
      isRoadLikeHighway(segment.tags),
    )
    expect(result.map((s) => s.id)).toEqual([2])
  })
})

describe('pickBestNeighbor', () => {
  it('returns single candidate', () => {
    const from = makeSegment(1, [10, 20])
    const next = makeSegment(2, [20, 30])
    expect(pickBestNeighbor(from, [next])?.id).toBe(2)
  })

  it('returns undefined when ambiguous and no same kind', () => {
    const from = makeSegment(1, [10, 20], { highway: 'primary' })
    const a = makeSegment(2, [20, 30], { highway: 'footway' })
    const b = makeSegment(3, [20, 40], { highway: 'cycleway' })
    expect(pickBestNeighbor(from, [a, b])).toBeUndefined()
  })
})

describe('getEndpointNodeId', () => {
  it('returns last node for forward', () => {
    expect(getEndpointNodeId(makeSegment(1, [10, 20, 30]), 'forward')).toBe(30)
  })

  it('returns first node for backward', () => {
    expect(getEndpointNodeId(makeSegment(1, [10, 20, 30]), 'backward')).toBe(10)
  })
})

describe('isRoadLikeHighway', () => {
  it('accepts core road classes and links', () => {
    expect(isRoadLikeHighway({ highway: 'residential' })).toBe(true)
    expect(isRoadLikeHighway({ highway: 'primary_link' })).toBe(true)
    expect(isRoadLikeHighway({ highway: 'busway' })).toBe(true)
  })

  it('rejects non-road highways', () => {
    expect(isRoadLikeHighway({ highway: 'footway' })).toBe(false)
    expect(isRoadLikeHighway({ highway: 'cycleway' })).toBe(false)
  })
})
