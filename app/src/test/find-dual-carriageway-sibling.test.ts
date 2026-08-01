import { describe, expect, test } from 'bun:test'
import type { OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'
import { findDualCarriagewaySibling } from '../modes/lanes/domain/find-dual-carriageway-sibling'

function way(id: number, nodes: number[], tags: Record<string, string>): OsmWay {
  return {
    id,
    type: 'way',
    version: 1,
    changeset: 1,
    nodes,
    tags,
  }
}

/** nodeCoords are [lat, lon]. Junction at origin; duals leave N and S; continue leaves further N. */
function buildKarlMarxLikeGraph(): ParsedOsmData {
  // Shared junction node 1. Bidirectional approaches from south (unused here).
  // Dual A (964) leaves north: 1 → 2 → 3
  // Dual B (213) approaches from west-north then ends at 1: 4 → 1 (southbound into junction)
  // Actually for opposite: Dual B leaves south from 1: 1 → 5
  const nodeCoords: ParsedOsmData['nodeCoords'] = {
    1: [52.5, 13.4],
    2: [52.5005, 13.4],
    3: [52.501, 13.4],
    5: [52.4995, 13.4],
    6: [52.5015, 13.4],
  }
  const dualTags = {
    highway: 'secondary',
    name: 'Karl-Marx-Straße',
    oneway: 'yes',
    dual_carriageway: 'yes',
    lanes: '1',
  }
  const ways: ParsedOsmData['ways'] = {
    964: way(964, [1, 2, 3], dualTags),
    213: way(213, [1, 5], dualTags),
    // Same-carriageway continue at the far end of 964 (collinear north).
    970: way(970, [3, 6], dualTags),
  }
  return { relations: {}, ways, nodes: {}, nodeCoords, waysInRelation: {} }
}

describe('findDualCarriagewaySibling', () => {
  test('picks the opposite-bearing dual at the shared junction', () => {
    const graph = buildKarlMarxLikeGraph()
    const match = findDualCarriagewaySibling(graph, 964, { excludeWayIds: [970] })
    expect(match?.wayId).toBe(213)
  })

  test('prefers ~180° branch over collinear continue when both score equally', () => {
    const graph = buildKarlMarxLikeGraph()
    // Without exclude, continue at node 3 is ~0°; opposite at node 1 is ~180°.
    const match = findDualCarriagewaySibling(graph, 964)
    expect(match?.wayId).toBe(213)
  })

  test('returns null for non-dual ways', () => {
    const graph = buildKarlMarxLikeGraph()
    graph.ways[10] = way(10, [1, 2], { highway: 'secondary', lanes: '2' })
    expect(findDualCarriagewaySibling(graph, 10)).toBeNull()
  })

  test('honours excludeWayIds', () => {
    const graph = buildKarlMarxLikeGraph()
    expect(findDualCarriagewaySibling(graph, 964, { excludeWayIds: [213] })?.wayId).toBe(970)
  })
})
