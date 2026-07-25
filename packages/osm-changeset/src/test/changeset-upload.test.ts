import { type OsmNode, type OsmRelation, type OsmWay } from '@osm-editor-kit/osm-data'
import { type ChangesStore } from '../changes-store'
import { buildChangesetTags } from '../changeset-tags'
import {
  applyUploadResult,
  changesStoreToOsmChange,
  changesStoreToOsmChangeXml,
} from '../changeset-upload'

function createWay(id: number, overrides: Partial<OsmWay> = {}): OsmWay {
  return {
    id,
    type: 'way',
    version: id > 0 ? 3 : 1,
    changeset: 100,
    nodes: [10, 20, 30],
    tags: { highway: 'residential' },
    ...overrides,
  }
}
function createRelation(id: number, overrides: Partial<OsmRelation> = {}): OsmRelation {
  return {
    id,
    type: 'relation',
    version: id > 0 ? 3 : 1,
    changeset: 100,
    members: [
      { type: 'way', ref: 10, role: '' },
      { type: 'way', ref: -1, role: '' },
    ],
    tags: { type: 'route' },
    ...overrides,
  }
}

function createNode(id: number, overrides: Partial<OsmNode> = {}): OsmNode {
  return {
    id,
    type: 'node',
    version: id > 0 ? 3 : 1,
    changeset: 100,
    lat: 52.5,
    lon: 13.4,
    tags: {},
    ...overrides,
  }
}

describe('buildChangesetTags', () => {
  test('includes created_by, comment, and host', () => {
    expect(
      buildChangesetTags('Street Space Editor', '0.9.0', {
        host: 'https://example.com/parking/',
        comment: 'Street Space Editor',
      }),
    ).toEqual({
      created_by: 'Street Space Editor 0.9.0',
      comment: 'Street Space Editor',
      host: 'https://example.com/parking/',
    })
  })
})

describe('changesStoreToOsmChange', () => {
  test('maps modify ways into osm-api feature format', () => {
    const store: ChangesStore = {
      modify: { way: [createWay(42)], node: [], relation: [] },
      create: { way: [], node: [], relation: [] },
    }

    expect(changesStoreToOsmChange(store)).toEqual({
      create: [],
      modify: [
        {
          type: 'way',
          id: 42,
          version: 3,
          nodes: [10, 20, 30],
          tags: { highway: 'residential' },
          changeset: 100,
          timestamp: '',
          user: '',
          uid: 0,
        },
      ],
      delete: [],
    })
  })

  test('maps negative-id create ways (cut) into create bucket', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: { way: [createWay(-1, { tags: { highway: 'service' } })], node: [], relation: [] },
    }

    const diff = changesStoreToOsmChange(store)

    expect(diff.create).toHaveLength(1)
    expect(diff.create[0]!.id).toBe(-1)
    expect(diff.modify).toHaveLength(0)
    expect(diff.delete).toEqual([])
  })

  test('maps modified relations into osm-api feature format', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [createRelation(77)] },
      create: { way: [], node: [], relation: [] },
    }

    expect(changesStoreToOsmChange(store).modify[0]).toMatchObject({
      type: 'relation',
      id: 77,
      members: [
        { type: 'way', ref: 10, role: '' },
        { type: 'way', ref: -1, role: '' },
      ],
    })
  })

  test('includes created nodes before created ways', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: {
        node: [createNode(-5)],
        way: [createWay(-1, { nodes: [-5, 20, 30] })],
        relation: [],
      },
    }

    const diff = changesStoreToOsmChange(store)

    expect(diff.create.map((feature) => feature.type)).toEqual(['node', 'way'])
    expect(diff.create[0]).toMatchObject({ type: 'node', id: -5 })
    expect(diff.create[1]).toMatchObject({ type: 'way', id: -1, nodes: [-5, 20, 30] })
  })
})

describe('changesStoreToOsmChangeXml', () => {
  test('builds osmChange XML with comment metadata via createOsmChangeXml', () => {
    const store: ChangesStore = {
      modify: {
        way: [createWay(42, { tags: { highway: 'residential', width: '6' } })],
        node: [],
        relation: [],
      },
      create: { way: [], node: [], relation: [] },
    }

    const xml = changesStoreToOsmChangeXml(store, {
      tags: {
        comment: 'Update street space width for ways Test',
        created_by: 'Street Space Editor',
      },
    })

    expect(xml).toContain('<osmChange')
    expect(xml).toContain('<modify>')
    expect(xml).toContain('id="42"')
    expect(xml).toContain('k="width"')
    expect(xml).toContain('v="6"')
    expect(xml).toContain('Update street space width for ways Test')
  })
})

describe('applyUploadResult', () => {
  test('remaps created way ids and clears the store', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: { way: [createWay(-1)], node: [], relation: [] },
    }

    const changedIdMap = applyUploadResult(store, {
      999: {
        diffResult: {
          way: {
            '-1': { newId: 555001, newVersion: 1 },
          },
        },
      },
    })

    expect(changedIdMap).toEqual({ '-1': '555001' })
    expect(store.create.way).toHaveLength(0)
    expect(store.modify.way).toHaveLength(0)
    expect(store.create.node).toHaveLength(0)
    expect(store.modify.node).toHaveLength(0)
    expect(store.create.relation).toHaveLength(0)
    expect(store.modify.relation).toHaveLength(0)
  })

  test('remaps created node ids and updates pending way node refs', () => {
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [] },
      create: {
        node: [createNode(-5)],
        way: [createWay(-1, { nodes: [-5, 20, 30] })],
        relation: [],
      },
    }

    const changedIdMap = applyUploadResult(store, {
      999: {
        diffResult: {
          node: {
            '-5': { newId: 777005, newVersion: 1 },
          },
          way: {
            '-1': { newId: 555001, newVersion: 1 },
          },
        },
      },
    })

    expect(changedIdMap).toEqual({ '-5': '777005', '-1': '555001' })
    expect(store.create.way).toHaveLength(0)
    expect(store.create.node).toHaveLength(0)
  })

  test('updates modify way version without id remap entry', () => {
    const store: ChangesStore = {
      modify: { way: [createWay(42)], node: [], relation: [] },
      create: { way: [], node: [], relation: [] },
    }

    const changedIdMap = applyUploadResult(store, {
      1000: {
        diffResult: {
          way: {
            42: { newId: 42, newVersion: 4 },
          },
        },
      },
    })

    expect(changedIdMap).toEqual({})
    expect(store.modify.way).toHaveLength(0)
    expect(store.create.way).toHaveLength(0)
  })

  test('remaps created way ids inside modified relation members', () => {
    const relation = createRelation(77)
    const store: ChangesStore = {
      modify: { way: [], node: [], relation: [relation] },
      create: { way: [createWay(-1)], node: [], relation: [] },
    }

    const changedIdMap = applyUploadResult(store, {
      999: {
        diffResult: {
          way: {
            '-1': { newId: 555001, newVersion: 1 },
          },
        },
      },
    })

    expect(changedIdMap).toEqual({ '-1': '555001' })
    expect(relation.members[1]!.ref).toBe(555001)
    expect(store.modify.relation).toHaveLength(0)
    expect(store.create.relation).toHaveLength(0)
  })
})
