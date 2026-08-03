import { describe, expect, test } from 'bun:test'
import {
  filterElementsByBbox,
  type OsmMapFixtureIndex,
} from '../dev-osm-map-fixture/filter-elements-by-bbox'
import type { OsmMapElement } from '../dev-osm-map-fixture/types'

function buildTestIndex(elements: OsmMapElement[]): OsmMapFixtureIndex {
  const nodesById = new Map<number, OsmMapElement>()
  const waysById = new Map<number, OsmMapElement>()
  const relationsById = new Map<number, OsmMapElement>()
  const wayIdsByNodeId = new Map<number, number[]>()

  for (const element of elements) {
    if (element.type === 'node') nodesById.set(element.id, element)
    if (element.type === 'way') {
      waysById.set(element.id, element)
      for (const nodeId of element.nodes ?? []) {
        const existing = wayIdsByNodeId.get(nodeId)
        if (existing) existing.push(element.id)
        else wayIdsByNodeId.set(nodeId, [element.id])
      }
    }
    if (element.type === 'relation') relationsById.set(element.id, element)
  }

  return {
    nodesById,
    waysById,
    relationsById,
    wayIdsByNodeId,
    nodeIdsInBbox: (bbox) =>
      [...nodesById.values()]
        .filter(
          (node) =>
            node.lon! >= bbox.west &&
            node.lon! <= bbox.east &&
            node.lat! >= bbox.south &&
            node.lat! <= bbox.north,
        )
        .map((node) => node.id),
  }
}

describe('filterElementsByBbox', () => {
  test('returns nodes in bbox only when no ways connect', () => {
    const index = buildTestIndex([
      { type: 'node', id: 1, lat: 52.5, lon: 13.4 },
      { type: 'node', id: 2, lat: 52.6, lon: 13.5 },
    ])

    const elements = filterElementsByBbox(index, {
      west: 13.39,
      south: 52.49,
      east: 13.41,
      north: 52.51,
    })

    expect(elements).toHaveLength(1)
    expect(elements[0]).toMatchObject({ type: 'node', id: 1 })
  })

  test('includes all nodes for a way that partially intersects the bbox', () => {
    const index = buildTestIndex([
      { type: 'node', id: 1, lat: 52.5, lon: 13.4 },
      { type: 'node', id: 2, lat: 52.5, lon: 13.6 },
      { type: 'way', id: 10, nodes: [1, 2], tags: { highway: 'residential' } },
    ])

    const elements = filterElementsByBbox(index, {
      west: 13.39,
      south: 52.49,
      east: 13.41,
      north: 52.51,
    })

    const nodeIds = elements.filter((e) => e.type === 'node').map((e) => e.id)
    expect(nodeIds.sort()).toEqual([1, 2])
    expect(elements.some((e) => e.type === 'way' && e.id === 10)).toBe(true)
  })

  test('includes relations that reference included nodes or ways', () => {
    const index = buildTestIndex([
      { type: 'node', id: 1, lat: 52.5, lon: 13.4 },
      { type: 'way', id: 10, nodes: [1], tags: { highway: 'residential' } },
      {
        type: 'relation',
        id: 100,
        members: [{ type: 'way', ref: 10, role: '' }],
        tags: { type: 'route' },
      },
    ])

    const elements = filterElementsByBbox(index, {
      west: 13.39,
      south: 52.49,
      east: 13.41,
      north: 52.51,
    })

    expect(elements.some((e) => e.type === 'relation' && e.id === 100)).toBe(true)
  })

  test('returns empty array when bbox is outside fixture extent', () => {
    const index = buildTestIndex([{ type: 'node', id: 1, lat: 52.5, lon: 13.4 }])

    const elements = filterElementsByBbox(index, {
      west: 10,
      south: 50,
      east: 11,
      north: 51,
    })

    expect(elements).toEqual([])
  })
})
