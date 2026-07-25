import { describe, expect, test } from 'bun:test'
import type { OsmRelation, OsmWay } from '@osm-editor-kit/osm-data'
import { emptyParsedOsmData } from '@osm-editor-kit/osm-data'
import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  assessWaySplitRegardingRelations,
  hasFromViaTo,
  parentRelations,
} from '../way-split-relations'

function makeWay(
  id: number,
  nodes: number[],
  tags: OsmWay['tags'] = { highway: 'residential' },
): OsmWay {
  return {
    type: 'way',
    id,
    version: 1,
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
    version: 1,
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

describe('parentRelations', () => {
  test('returns relations containing the way', () => {
    const graph = graphWith(
      { 10: makeWay(10, [1, 2, 3]) },
      { 100: makeRelation(100, [{ type: 'way', ref: 10, role: '' }], { type: 'route' }) },
    )
    expect(parentRelations(graph, 10)).toHaveLength(1)
    expect(parentRelations(graph, 10)[0]!.id).toBe(100)
    expect(parentRelations(graph, 99)).toHaveLength(0)
  })
})

describe('hasFromViaTo', () => {
  test('detects restriction and destination_sign shapes', () => {
    expect(
      hasFromViaTo(
        makeRelation(
          1,
          [
            { type: 'way', ref: 1, role: 'from' },
            { type: 'node', ref: 2, role: 'via' },
            { type: 'way', ref: 3, role: 'to' },
          ],
          { type: 'restriction' },
        ),
      ),
    ).toBe(true)

    expect(
      hasFromViaTo(
        makeRelation(
          2,
          [
            { type: 'way', ref: 1, role: 'from' },
            { type: 'node', ref: 2, role: 'intersection' },
            { type: 'way', ref: 3, role: 'to' },
          ],
          { type: 'destination_sign' },
        ),
      ),
    ).toBe(true)

    expect(
      hasFromViaTo(
        makeRelation(3, [{ type: 'way', ref: 1, role: 'outer' }], { type: 'multipolygon' }),
      ),
    ).toBe(false)
  })
})

describe('assessWaySplitRegardingRelations', () => {
  test('returns ok when the way has no parent relations', () => {
    const graph = graphWith({ 10: makeWay(10, [1, 2, 3]) })
    expect(assessWaySplitRegardingRelations(graph, 10)).toBe('ok')
  })

  test('returns ok when the way is the sole relation member', () => {
    const graph = graphWith(
      { 10: makeWay(10, [1, 2, 3]) },
      { 100: makeRelation(100, [{ type: 'way', ref: 10, role: '' }], { type: 'route' }) },
    )
    expect(assessWaySplitRegardingRelations(graph, 10)).toBe('ok')
  })

  test('returns parent_incomplete when route neighbors are missing', () => {
    const graph = graphWith(
      { 10: makeWay(10, [1, 2, 3]) },
      {
        100: makeRelation(
          100,
          [
            { type: 'way', ref: 20, role: '' },
            { type: 'way', ref: 10, role: '' },
            { type: 'way', ref: 30, role: '' },
          ],
          { type: 'route' },
        ),
      },
    )
    expect(assessWaySplitRegardingRelations(graph, 10)).toBe('parent_incomplete')
  })

  test('returns ok when at least one route neighbor is loaded', () => {
    const graph = graphWith(
      {
        10: makeWay(10, [1, 2, 3]),
        20: makeWay(20, [0, 1]),
      },
      {
        100: makeRelation(
          100,
          [
            { type: 'way', ref: 20, role: '' },
            { type: 'way', ref: 10, role: '' },
            { type: 'way', ref: 30, role: '' },
          ],
          { type: 'route' },
        ),
      },
    )
    expect(assessWaySplitRegardingRelations(graph, 10)).toBe('ok')
  })

  test('returns parent_incomplete when a via member is missing', () => {
    const graph = graphWith(
      { 10: makeWay(10, [1, 2, 3]) },
      {
        200: makeRelation(
          200,
          [
            { type: 'way', ref: 10, role: 'from' },
            { type: 'node', ref: 99, role: 'via' },
            { type: 'way', ref: 30, role: 'to' },
          ],
          { type: 'restriction' },
        ),
      },
    )
    expect(assessWaySplitRegardingRelations(graph, 10)).toBe('parent_incomplete')
  })

  test('returns simple_roundabout for closed roundabout in a route', () => {
    const graph = graphWith(
      {
        10: makeWay(10, [1, 2, 3, 1], { highway: 'residential', junction: 'roundabout' }),
        20: makeWay(20, [0, 1]),
      },
      {
        100: makeRelation(
          100,
          [
            { type: 'way', ref: 20, role: '' },
            { type: 'way', ref: 10, role: '' },
          ],
          { type: 'route' },
        ),
      },
    )
    expect(assessWaySplitRegardingRelations(graph, 10)).toBe('simple_roundabout')
  })

  test('allows closed roundabout in junction and enforcement relations', () => {
    const roundabout = makeWay(10, [1, 2, 3, 1], { highway: 'residential', junction: 'roundabout' })
    const neighbor = makeWay(20, [0, 1])

    const junctionGraph = graphWith(
      { 10: roundabout, 20: neighbor },
      {
        300: makeRelation(
          300,
          [
            { type: 'way', ref: 20, role: '' },
            { type: 'way', ref: 10, role: '' },
          ],
          { type: 'junction' },
        ),
      },
    )
    expect(assessWaySplitRegardingRelations(junctionGraph, 10)).toBe('ok')

    const enforcementGraph = graphWith(
      { 10: roundabout, 20: neighbor },
      {
        400: makeRelation(
          400,
          [
            { type: 'way', ref: 20, role: '' },
            { type: 'way', ref: 10, role: '' },
          ],
          { type: 'enforcement' },
        ),
      },
    )
    expect(assessWaySplitRegardingRelations(enforcementGraph, 10)).toBe('ok')
  })
})
