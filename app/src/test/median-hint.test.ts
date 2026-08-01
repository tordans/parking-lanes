import { describe, expect, test } from 'bun:test'
import type { OsmNode, OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'
import { medianHintForWay, wayHasCrossingNode } from '../modes/lanes/domain/median-hint'

function way(id: number, nodes: number[], tags: Record<string, string>): OsmWay {
  return { id, type: 'way', version: 1, changeset: 1, nodes, tags }
}

function node(id: number, tags?: Record<string, string>): OsmNode {
  return {
    id,
    type: 'node',
    version: 1,
    changeset: 1,
    lat: 52.5,
    lon: 13.4,
    tags: tags ?? {},
  }
}

describe('medianHintForWay', () => {
  test('defaults to verge without crossing nodes', () => {
    const graph: ParsedOsmData = {
      relations: {},
      ways: { 1: way(1, [10, 11], { highway: 'secondary', dual_carriageway: 'yes' }) },
      nodes: { 10: node(10), 11: node(11) },
      nodeCoords: { 10: [52.5, 13.4], 11: [52.501, 13.4] },
      waysInRelation: {},
    }
    expect(wayHasCrossingNode(graph, 1)).toBe(false)
    expect(medianHintForWay(graph, 1)).toBe('verge')
  })

  test('detects highway=crossing on a way node', () => {
    const graph: ParsedOsmData = {
      relations: {},
      ways: { 1: way(1, [10, 11, 12], { highway: 'secondary' }) },
      nodes: {
        10: node(10),
        11: node(11, { highway: 'crossing', crossing: 'traffic_signals' }),
        12: node(12),
      },
      nodeCoords: {
        10: [52.5, 13.4],
        11: [52.5005, 13.4],
        12: [52.501, 13.4],
      },
      waysInRelation: {},
    }
    expect(wayHasCrossingNode(graph, 1)).toBe(true)
    expect(medianHintForWay(graph, 1)).toBe('crossing')
  })
})
