import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { splitOsmWayAtNode, wayHasSplittableInterior } from '../split-osm-way'

function makeWay(nodes: number[], id = 10): OsmWay {
  return {
    type: 'way',
    id,
    version: 3,
    user: 'mapper',
    uid: 1,
    timestamp: '2024-01-01T00:00:00Z',
    nodes,
    tags: { highway: 'residential', width: '5' },
  }
}

describe('splitOsmWayAtNode', () => {
  test('splits at an interior node and clears create metadata on the new way', () => {
    const way = makeWay([1, 2, 3, 4])
    const result = splitOsmWayAtNode(way, 3, -1)
    expect(result).not.toBeNull()
    expect(result!.oldWay.nodes).toEqual([1, 2, 3])
    expect(result!.oldWay.id).toBe(10)
    expect(result!.oldWay.version).toBe(3)
    expect(result!.newWay.nodes).toEqual([3, 4])
    expect(result!.newWay.id).toBe(-1)
    expect(result!.newWay.version).toBe(1)
    expect(result!.newWay.tags).toEqual(way.tags)
    expect(result!.newWay.user).toBeUndefined()
    expect(result!.newWay.uid).toBeUndefined()
    expect(result!.newWay.timestamp).toBeUndefined()
  })

  test('returns null for endpoints and missing nodes', () => {
    const way = makeWay([1, 2, 3])
    expect(splitOsmWayAtNode(way, 1, -1)).toBeNull()
    expect(splitOsmWayAtNode(way, 3, -1)).toBeNull()
    expect(splitOsmWayAtNode(way, 99, -1)).toBeNull()
  })
})

describe('wayHasSplittableInterior', () => {
  test('requires at least three nodes', () => {
    expect(wayHasSplittableInterior(makeWay([1, 2]))).toBe(false)
    expect(wayHasSplittableInterior(makeWay([1, 2, 3]))).toBe(true)
  })
})
