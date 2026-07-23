import { uploadChangeset } from 'osm-api'

import { applyUploadResult, changesStoreToOsmChange } from '../utils/changeset-upload'
import { uploadChanges } from '../utils/osm-client'
import { buildChangesetTags } from '../utils/osmUploadChangeset'
import { type ChangesStore } from '../utils/types/changes-store'
import { type OsmWay } from '../utils/types/osm-data'

jest.mock('osm-api', () => {
    const actual = jest.requireActual('osm-api')
    return {
        ...actual,
        uploadChangeset: jest.fn(),
    }
})

const mockUploadChangeset = uploadChangeset as jest.MockedFunction<typeof uploadChangeset>

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
        expect(buildChangesetTags('PLanes', '0.9.0', 'https://example.com/parking/')).toEqual({
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
            modify: [{
                type: 'way',
                id: 42,
                version: 3,
                nodes: [10, 20, 30],
                tags: { highway: 'residential' },
                changeset: 100,
                timestamp: '',
                user: '',
                uid: 0,
            }],
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
        expect(diff.create[0].id).toBe(-1)
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

describe('uploadChanges', () => {
    beforeEach(() => {
        mockUploadChangeset.mockReset()
        const location: Pick<Location, 'origin' | 'pathname'> = {
            origin: 'https://example.com',
            pathname: '/lanes/',
        }
        global.window = { location } as Window & typeof globalThis
    })

    test('calls uploadChangeset with tags and diff without real network', async() => {
        const store: ChangesStore = {
            modify: { way: [createWay(7)] },
            create: { way: [createWay(-2)] },
        }

        mockUploadChangeset.mockResolvedValue({
            12345: {
                diffResult: {
                    way: {
                        7: { newId: 7, newVersion: 5 },
                        '-2': { newId: 888002, newVersion: 1 },
                    },
                },
            },
        })

        const changedIdMap = await uploadChanges('PLanes', '0.9.0', store)

        expect(mockUploadChangeset).toHaveBeenCalledTimes(1)
        expect(mockUploadChangeset).toHaveBeenCalledWith(
            {
                created_by: 'PLanes 0.9.0',
                comment: 'Parking lanes',
                host: 'https://example.com/lanes/',
            },
            {
                create: [expect.objectContaining({ type: 'way', id: -2 })],
                modify: [expect.objectContaining({ type: 'way', id: 7 })],
                delete: [],
            },
        )
        expect(changedIdMap).toEqual({ '-2': '888002' })
        expect(store.modify.way).toHaveLength(0)
        expect(store.create.way).toHaveLength(0)
    })

    test('wraps osm-api errors as OsmApiRequestError', async() => {
        mockUploadChangeset.mockRejectedValue(new Error('OSM API: changeset required'))

        const store: ChangesStore = {
            modify: { way: [createWay(1)] },
            create: { way: [] },
        }

        await expect(uploadChanges('PLanes', '0.9.0', store)).rejects.toMatchObject({
            name: 'OsmApiRequestError',
            responseText: 'changeset required',
        })
    })
})
