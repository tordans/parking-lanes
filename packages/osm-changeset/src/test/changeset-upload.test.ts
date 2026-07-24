import { type OsmWay } from '@osm-editor-kit/osm-data'
import { type ChangesStore } from '../changes-store'
import { buildChangesetTags } from '../changeset-tags'
import { applyUploadResult, changesStoreToOsmChange } from '../changeset-upload'

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

describe('buildChangesetTags', () => {
  test('includes created_by, comment, and host', () => {
    expect(
      buildChangesetTags('PLanes', '0.9.0', {
        host: 'https://example.com/parking/',
        comment: 'Parking lanes',
      }),
    ).toEqual({
      created_by: 'PLanes 0.9.0',
      comment: 'Parking lanes',
      host: 'https://example.com/parking/',
    })
  })
})

describe('changesStoreToOsmChange', () => {
  test('maps modify ways into osm-api feature format', () => {
    const store: ChangesStore = {
      modify: { way: [createWay(42)] },
      create: { way: [] },
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
      modify: { way: [] },
      create: { way: [createWay(-1, { tags: { highway: 'service' } })] },
    }

    const diff = changesStoreToOsmChange(store)

    expect(diff.create).toHaveLength(1)
    expect(diff.create[0]!.id).toBe(-1)
    expect(diff.modify).toHaveLength(0)
    expect(diff.delete).toEqual([])
  })
})

describe('applyUploadResult', () => {
  test('remaps created way ids and clears the store', () => {
    const store: ChangesStore = {
      modify: { way: [] },
      create: { way: [createWay(-1)] },
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
  })

  test('updates modify way version without id remap entry', () => {
    const store: ChangesStore = {
      modify: { way: [createWay(42)] },
      create: { way: [] },
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
})
