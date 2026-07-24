import { describe, expect, test } from 'bun:test'
import { emptyParsedOsmData, mergeParsedOsm, parseOsmResp } from '../data-client'
import type { OsmWay } from '../types/osm-data'

describe('mergeParsedOsm', () => {
  test('merges nodes and keeps newer way versions', () => {
    const existing = emptyParsedOsmData()
    existing.ways[1] = {
      type: 'way',
      id: 1,
      version: 1,
      nodes: [10, 11],
      tags: { highway: 'residential' },
    }

    const incoming = emptyParsedOsmData()
    incoming.nodeCoords[10] = [52.47, 13.44]
    incoming.ways[1] = {
      type: 'way',
      id: 1,
      version: 2,
      nodes: [10, 11],
      tags: { highway: 'residential', 'parking:lane:right': 'parallel' },
    }

    const merged = mergeParsedOsm(existing, incoming)
    expect(merged.nodeCoords[10]).toEqual([52.47, 13.44])
    expect(merged.ways[1]?.version).toBe(2)
    expect(merged.ways[1]?.tags['parking:lane:right']).toBe('parallel')
  })

  test('keeps existing way when incoming version is older', () => {
    const existing = emptyParsedOsmData()
    existing.ways[1] = {
      type: 'way',
      id: 1,
      version: 3,
      nodes: [10],
      tags: { highway: 'residential', name: 'Kept' },
    }

    const incoming = emptyParsedOsmData()
    incoming.ways[1] = {
      type: 'way',
      id: 1,
      version: 2,
      nodes: [10],
      tags: { highway: 'residential', name: 'Stale' },
    }

    const merged = mergeParsedOsm(existing, incoming)
    expect(merged.ways[1]?.tags.name).toBe('Kept')
  })
})

describe('parseOsmResp', () => {
  test('parses ways and relation membership', () => {
    const parsed = parseOsmResp({
      elements: [
        {
          type: 'way',
          id: 42,
          version: 1,
          nodes: [1, 2],
          tags: { highway: 'residential' },
        },
        {
          type: 'relation',
          id: 7,
          version: 1,
          members: [{ type: 'way', ref: 42, role: 'outer' }],
          tags: { amenity: 'parking' },
        },
      ],
    })

    expect(parsed.ways[42]?.id).toBe(42)
    expect(parsed.relations[7]?.id).toBe(7)
    expect(parsed.waysInRelation[42]).toBe(true)
  })
})

function makeWay(
  id: number,
  version: number,
  tags: OsmWay['tags'] = { highway: 'residential' },
): OsmWay {
  return { type: 'way', id, version, nodes: [1, 2, 3], tags }
}

export { makeWay }
