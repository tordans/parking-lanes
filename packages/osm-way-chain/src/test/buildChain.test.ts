import { describe, expect, it } from 'bun:test'
import type { Segment } from '../domain/types'
import type { OsmDataAdapter } from '../ports/OsmDataAdapter'
import { buildChain, recenterChain } from '../traversal/buildChain'

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

function mockAdapter(
  ways: Record<number, Segment>,
  nodeWays: Record<number, number[]>,
): OsmDataAdapter {
  return {
    getWay: async (wayId) => {
      const way = ways[wayId]
      if (!way) throw new Error(`Way ${wayId} not found`)
      return way
    },
    getWaysForNode: async (nodeId) => {
      const ids = nodeWays[nodeId] ?? []
      return ids.map((id) => ways[id]!).filter(Boolean)
    },
  }
}

describe('buildChain', () => {
  it('builds a chain with center and neighbors', async () => {
    const ways = {
      100: makeSegment(100, [1, 2]),
      101: makeSegment(101, [2, 3]),
      102: makeSegment(102, [0, 1]),
    }
    const adapter = mockAdapter(ways, {
      0: [102],
      1: [102, 100],
      2: [100, 101],
      3: [101],
    })

    const { chain } = await buildChain(adapter, { centerWayId: 100, maxPerSide: 2 })
    expect(chain.segments.map((s) => s.id)).toEqual([102, 100, 101])
    expect(chain.centerIndex).toBe(1)
  })
})

describe('recenterChain', () => {
  it('updates center index', () => {
    const chain = {
      segments: [makeSegment(1, [1, 2]), makeSegment(2, [2, 3]), makeSegment(3, [3, 4])],
      centerIndex: 1,
    }
    const recentered = recenterChain(chain, 3)
    expect(recentered.centerIndex).toBe(2)
  })
})
