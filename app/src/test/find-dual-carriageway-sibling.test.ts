import { describe, expect, test } from 'bun:test'
import type { OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  DUAL_SIBLING_MAX_DISTANCE_M,
  DUAL_SIBLING_MIN_DISTANCE_M,
  findDualCarriagewaySibling,
} from '../modes/lanes/domain/find-dual-carriageway-sibling'

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

const dualTags = {
  highway: 'secondary',
  name: 'Karl-Marx-Straße',
  oneway: 'yes',
  dual_carriageway: 'yes',
  lanes: '1',
}

/**
 * Parallel dual branches ~15 m apart; collinear tip links at the far ends.
 * nodeCoords are [lat, lon].
 */
function buildParallelDualGraph(): ParsedOsmData {
  const nodeCoords: ParsedOsmData['nodeCoords'] = {
    1: [52.5, 13.4],
    2: [52.5005, 13.4],
    3: [52.501, 13.4],
    5: [52.4995, 13.4],
    6: [52.5015, 13.4],
    7: [52.4995, 13.40015],
    8: [52.5005, 13.40015],
    9: [52.501, 13.40015],
    10: [52.499, 13.40015],
  }
  const ways: ParsedOsmData['ways'] = {
    964: way(964, [1, 2, 3], dualTags),
    213: way(213, [9, 8, 7], dualTags),
    970: way(970, [3, 6], dualTags),
    1002238499: way(1002238499, [7, 10], dualTags),
  }
  return { relations: {}, ways, nodes: {}, nodeCoords, waysInRelation: {} }
}

describe('findDualCarriagewaySibling', () => {
  test('finds antiparallel opposite branch over collinear tip links', () => {
    const graph = buildParallelDualGraph()
    const match = findDualCarriagewaySibling(graph, 964)
    expect(match?.wayId).toBe(213)
    expect(match?.distanceM).toBeGreaterThanOrEqual(DUAL_SIBLING_MIN_DISTANCE_M)
    expect(match?.distanceM).toBeLessThanOrEqual(DUAL_SIBLING_MAX_DISTANCE_M)
  })

  test('rejects end-to-end tip link that shares an endpoint but is not the parallel branch', () => {
    const graph = buildParallelDualGraph()
    expect(findDualCarriagewaySibling(graph, 213)?.wayId).toBe(964)
    expect(findDualCarriagewaySibling(graph, 1002238499)).toBeNull()
  })

  test('rejects collinear continuation at the far end (perpendicular distance ~0)', () => {
    const graph = buildParallelDualGraph()
    expect(findDualCarriagewaySibling(graph, 970)).toBeNull()
  })

  test('returns null for non-dual ways', () => {
    const graph = buildParallelDualGraph()
    graph.ways[10] = way(10, [1, 2], { highway: 'secondary', lanes: '2' })
    expect(findDualCarriagewaySibling(graph, 10)).toBeNull()
  })

  test('prefers tighter antiparallel alignment when multiple candidates qualify', () => {
    const graph = buildParallelDualGraph()
    graph.ways[888] = way(888, [1, 5], {
      ...dualTags,
      name: 'Other',
      dual_carriageway: 'no',
    })
    const match = findDualCarriagewaySibling(graph, 964)
    expect(match?.wayId).toBe(213)
  })
})
