import { describe, expect, test } from 'bun:test'
import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { Segment } from '@osm-editor-kit/osm-way-chain'
import {
  originalOsmKeyIfDirectionFlipped,
  osmKeyFromDisplayKey,
} from '../modes/table/domain/table-edits'
import {
  buildTableDisplayChain,
  insertDualCarriagewaySiblings,
  reorientChainAroundCenter,
  windowChainAroundCenter,
} from '../modes/table/domain/window-table-chain'

function makeSegment(id: number, overrides: Partial<Segment> = {}): Segment {
  return {
    id,
    version: 1,
    nodeIds: [id * 10, id * 10 + 1],
    tags: { highway: 'residential' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [13, 52],
        [13.001, 52],
      ],
    },
    ...overrides,
  }
}

describe('windowChainAroundCenter', () => {
  test('keeps at most maxPerSide neighbours on each side', () => {
    const segments = Array.from({ length: 20 }, (_, i) => makeSegment(i + 1))
    const windowed = windowChainAroundCenter(segments, 10, 5)
    expect(windowed.segments.map((s) => s.id)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    expect(windowed.centerIndex).toBe(5)
    expect(windowed.segments[windowed.centerIndex]?.id).toBe(11)
  })

  test('clamps near the start of the chain', () => {
    const segments = Array.from({ length: 8 }, (_, i) => makeSegment(i + 1))
    const windowed = windowChainAroundCenter(segments, 1, 5)
    expect(windowed.segments.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(windowed.centerIndex).toBe(1)
  })

  test('clamps near the end of the chain', () => {
    const segments = Array.from({ length: 8 }, (_, i) => makeSegment(i + 1))
    const windowed = windowChainAroundCenter(segments, 6, 5)
    expect(windowed.segments.map((s) => s.id)).toEqual([2, 3, 4, 5, 6, 7, 8])
    expect(windowed.centerIndex).toBe(5)
  })
})

describe('reorientChainAroundCenter', () => {
  test('swaps left/right on a neighbour digitised opposite the chain', () => {
    // Center 1→2, neighbour shares node 2 but is digitised 3→2 (meets at end/end → reversed).
    const graph = {
      ways: {
        1: {
          id: 1,
          version: 1,
          nodes: [1, 2],
          tags: { highway: 'residential', 'cycleway:left': 'lane' },
        },
        2: {
          id: 2,
          version: 1,
          nodes: [3, 2],
          tags: { highway: 'residential', 'cycleway:left': 'track' },
        },
      },
      nodeCoords: {
        1: [52, 13],
        2: [52, 13.001],
        3: [52, 13.002],
      },
    } as unknown as ParsedOsmData

    const reoriented = reorientChainAroundCenter([1, 2], 0, graph)
    expect(reoriented.segments[0]?.reversed).toBe(false)
    expect(reoriented.segments[0]?.tags['cycleway:left']).toBe('lane')
    expect(reoriented.segments[1]?.reversed).toBe(true)
    expect(reoriented.segments[1]?.tags['cycleway:right']).toBe('track')
    expect(reoriented.segments[1]?.tags['cycleway:left']).toBeUndefined()
  })
})

describe('originalOsmKeyIfDirectionFlipped', () => {
  test('returns the raw OSM key when display left/right was flipped', () => {
    expect(originalOsmKeyIfDirectionFlipped('cycleway:left', true)).toBe('cycleway:right')
    expect(originalOsmKeyIfDirectionFlipped('highway', true)).toBeNull()
    expect(originalOsmKeyIfDirectionFlipped('cycleway:left', false)).toBeNull()
    expect(osmKeyFromDisplayKey('cycleway:left', true)).toBe('cycleway:right')
  })
})

describe('insertDualCarriagewaySiblings', () => {
  test('inserts opposite dual branch beside its pair without shifting centre when after centre', () => {
    // Shared node 99: center dual and sibling meet at an endpoint.
    const center = makeSegment(100, {
      nodeIds: [1, 99],
      tags: {
        highway: 'primary',
        oneway: 'yes',
        dual_carriageway: 'yes',
        name: 'Test',
      },
    })
    const siblingWay = {
      id: 200,
      version: 1,
      nodes: [99, 2],
      tags: {
        highway: 'primary',
        oneway: 'yes',
        dual_carriageway: 'yes',
        name: 'Test',
      },
    }
    const left = makeSegment(50, { nodeIds: [0, 1] })
    const graph = {
      ways: {
        100: {
          id: 100,
          version: 1,
          nodes: center.nodeIds,
          tags: center.tags,
        },
        200: siblingWay,
        50: { id: 50, version: 1, nodes: left.nodeIds, tags: left.tags },
      },
      nodeCoords: {
        0: [52, 13],
        1: [52, 13.001],
        99: [52, 13.002],
        2: [52.001, 13.002],
      },
    } as unknown as ParsedOsmData

    const result = insertDualCarriagewaySiblings(
      { segments: [left, center], centerIndex: 1 },
      graph,
    )
    expect(result.segments.map((s) => s.id)).toEqual([50, 100, 200])
    expect(result.centerIndex).toBe(1)
    expect(result.segments[2]?.dualSiblingOf).toBe(100)
  })
})

describe('buildTableDisplayChain', () => {
  test('windows first then adds duals', () => {
    const segments = Array.from({ length: 20 }, (_, i) => makeSegment(i + 1))
    const display = buildTableDisplayChain(segments, 10, undefined, 5)
    expect(display.segments).toHaveLength(11)
    expect(display.segments[display.centerIndex]?.id).toBe(11)
  })
})
