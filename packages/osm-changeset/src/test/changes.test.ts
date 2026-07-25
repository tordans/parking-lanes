import { type OsmNode, type OsmRelation, type OsmWay } from '@osm-editor-kit/osm-data'
import {
  countChanges,
  removeChangedWay,
  upsertChangedNode,
  upsertChangedRelation,
  upsertChangedWay,
} from '../changes'
import { type ChangesStore } from '../changes-store'

function createWay(id: number): OsmWay {
  return {
    id,
    type: 'way',
    version: 1,
    changeset: 1,
    nodes: [1, 2],
    tags: {},
  }
}

function createNode(id: number): OsmNode {
  return {
    id,
    type: 'node',
    version: 1,
    changeset: 1,
    lat: 52.5,
    lon: 13.4,
    tags: {},
  }
}

function createRelation(id: number): OsmRelation {
  return {
    id,
    type: 'relation',
    version: 1,
    changeset: 1,
    members: [{ type: 'way', ref: 1, role: '' }],
    tags: { type: 'route' },
  }
}

describe('changes store helpers', () => {
  test('upsertChangedWay adds and updates modify entries for positive ids', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: { way: [], node: [], relation: [] },
    }
    const way = createWay(42)

    upsertChangedWay(store, way)
    expect(store.modify.way).toHaveLength(1)
    expect(countChanges(store)).toBe(1)

    const updatedWay = { ...way, tags: { highway: 'residential' } }
    upsertChangedWay(store, updatedWay)
    expect(store.modify.way).toHaveLength(1)
    expect(store.modify.way[0].tags.highway).toBe('residential')
  })

  test('upsertChangedWay tracks negative ids in create bucket', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: { way: [], node: [], relation: [] },
    }
    const way = createWay(-1)

    upsertChangedWay(store, way)
    expect(store.create.way).toHaveLength(1)
    expect(store.modify.way).toHaveLength(0)
    expect(countChanges(store)).toBe(1)
  })

  test('removeChangedWay removes modify and create entries', () => {
    const store: ChangesStore = {
      modify: { way: [createWay(5)], node: [], relation: [] },
      create: { way: [createWay(-2)], node: [], relation: [] },
    }

    expect(removeChangedWay(store, 5)?.id).toBe(5)
    expect(store.modify.way).toHaveLength(0)
    expect(removeChangedWay(store, -2)?.id).toBe(-2)
    expect(store.create.way).toHaveLength(0)
    expect(removeChangedWay(store, 99)).toBeNull()
  })

  test('upsertChangedNode tracks negative ids in create bucket', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: { way: [], node: [], relation: [] },
    }
    const node = createNode(-3)

    upsertChangedNode(store, node)
    expect(store.create.node).toHaveLength(1)
    expect(countChanges(store)).toBe(1)
  })

  test('upsertChangedRelation tracks positive ids in modify bucket', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: { way: [], node: [], relation: [] },
    }
    const relation = createRelation(42)

    upsertChangedRelation(store, relation)
    expect(store.modify.relation).toHaveLength(1)
    expect(countChanges(store)).toBe(1)
  })
})
