import { describe, expect, test } from 'bun:test'
import type { OsmRelation, OsmWay } from '@osm-editor-kit/osm-data'
import { emptyParsedOsmData } from '@osm-editor-kit/osm-data'
import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import { splitOsmWayAtNodeInGraph } from '../split-osm-way-in-graph'

function makeWay(
  id: number,
  nodes: number[],
  tags: OsmWay['tags'] = { highway: 'residential' },
): OsmWay {
  return {
    type: 'way',
    id,
    version: 2,
    changeset: 1,
    nodes,
    tags,
  }
}

function makeRelation(
  id: number,
  members: OsmRelation['members'],
  tags: OsmRelation['tags'] = {},
): OsmRelation {
  return {
    type: 'relation',
    id,
    version: 3,
    changeset: 1,
    members,
    tags,
  }
}

function graphWith(
  ways: Record<number, OsmWay>,
  relations: Record<number, OsmRelation> = {},
): ParsedOsmData {
  const graph = emptyParsedOsmData()
  graph.ways = ways
  graph.relations = relations
  for (const relation of Object.values(relations)) {
    for (const member of relation.members) {
      if (member.type === 'way') graph.waysInRelation[member.ref] = true
    }
  }
  return graph
}

describe('splitOsmWayAtNodeInGraph', () => {
  test('splits the way and inserts the new member into a route relation', () => {
    const graph = graphWith(
      {
        10: makeWay(10, [1, 2, 3, 4]),
        20: makeWay(20, [0, 1]),
        40: makeWay(40, [4, 5]),
      },
      {
        100: makeRelation(
          100,
          [
            { type: 'way', ref: 20, role: '' },
            { type: 'way', ref: 10, role: '' },
            { type: 'way', ref: 40, role: '' },
          ],
          { type: 'route' },
        ),
      },
    )

    const result = splitOsmWayAtNodeInGraph(graph, 10, 3, -1)
    expect(result).not.toBeNull()
    expect(result!.oldWay.nodes).toEqual([1, 2, 3])
    expect(result!.newWay.nodes).toEqual([3, 4])
    expect(result!.modifiedRelations).toHaveLength(1)

    const relation = result!.graph.relations[100]!
    expect(relation.members.map((member) => member.ref)).toEqual([20, 10, -1, 40])
    expect(result!.graph.waysInRelation[-1]).toBe(true)
  })

  test('keeps only the from/to half connected to the via node', () => {
    const graph = graphWith(
      {
        10: makeWay(10, [1, 2, 3]),
        30: makeWay(30, [3, 4]),
      },
      {
        200: makeRelation(
          200,
          [
            { type: 'way', ref: 10, role: 'from' },
            { type: 'node', ref: 3, role: 'via' },
            { type: 'way', ref: 30, role: 'to' },
          ],
          { type: 'restriction' },
        ),
      },
    )
    graph.nodeCoords[3] = [52.5, 13.4]

    const result = splitOsmWayAtNodeInGraph(graph, 10, 2, -1)
    expect(result).not.toBeNull()
    const relation = result!.graph.relations[200]!
    expect(relation.members.find((member) => member.role === 'from')?.ref).toBe(-1)
    expect(relation.members.some((member) => member.ref === 10)).toBe(false)
  })

  test('inserts a new via member when splitting a via way', () => {
    const graph = graphWith(
      {
        10: makeWay(10, [1, 2, 3, 4]),
        20: makeWay(20, [0, 1]),
        40: makeWay(40, [4, 5]),
      },
      {
        300: makeRelation(
          300,
          [
            { type: 'way', ref: 20, role: 'from' },
            { type: 'way', ref: 10, role: 'via' },
            { type: 'way', ref: 40, role: 'to' },
          ],
          { type: 'restriction' },
        ),
      },
    )

    const result = splitOsmWayAtNodeInGraph(graph, 10, 3, -1)
    expect(result).not.toBeNull()
    const viaRefs = result!.graph.relations[300]!.members.filter(
      (member) => member.role === 'via',
    ).map((member) => member.ref)
    expect(viaRefs).toEqual([10, -1])
  })
})
