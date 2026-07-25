import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import {
  insertNodeOnWaySegment,
  splitOsmWayAtNode,
  wayCanSplit,
  wayHasSplittableInterior,
} from '../split-osm-way'

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

describe('wayCanSplit', () => {
  test('requires at least two nodes', () => {
    expect(wayCanSplit(makeWay([1]))).toBe(false)
    expect(wayCanSplit(makeWay([1, 2]))).toBe(true)
    expect(wayCanSplit(makeWay([1, 2, 3]))).toBe(true)
  })
})

describe('insertNodeOnWaySegment', () => {
  test('inserts a node on the requested segment', () => {
    const way = makeWay([1, 2, 3])
    const result = insertNodeOnWaySegment(way, 1, { lat: 52.5, lon: 13.4 }, -10)
    expect(result).not.toBeNull()
    expect(result!.wayWithNode.nodes).toEqual([1, 2, -10, 3])
    expect(result!.newNode).toEqual({
      type: 'node',
      id: -10,
      lat: 52.5,
      lon: 13.4,
      version: 1,
      changeset: 0,
      tags: {},
    })
  })

  test('returns null for invalid segment indexes', () => {
    const way = makeWay([1, 2, 3])
    expect(insertNodeOnWaySegment(way, -1, { lat: 0, lon: 0 }, -1)).toBeNull()
    expect(insertNodeOnWaySegment(way, 2, { lat: 0, lon: 0 }, -1)).toBeNull()
  })

  test('supports insert then split on a two-node way', () => {
    const way = makeWay([1, 2])
    const inserted = insertNodeOnWaySegment(way, 0, { lat: 52.5, lon: 13.4 }, -10)
    expect(inserted).not.toBeNull()

    const split = splitOsmWayAtNode(inserted!.wayWithNode, -10, -20)
    expect(split).not.toBeNull()
    expect(split!.oldWay.nodes).toEqual([1, -10])
    expect(split!.newWay.nodes).toEqual([-10, 2])
  })

  test('supports insert then split on longer ways', () => {
    const way = makeWay([1, 2, 3, 4])
    const inserted = insertNodeOnWaySegment(way, 1, { lat: 52.5, lon: 13.4 }, -10)
    const split = splitOsmWayAtNode(inserted!.wayWithNode, -10, -20)
    expect(split!.oldWay.nodes).toEqual([1, 2, -10])
    expect(split!.newWay.nodes).toEqual([-10, 3, 4])
  })
})
