import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockUploadChangeset = mock(() => Promise.resolve({}))

mock.module('osm-api', () => {
  const actual = require('osm-api') as typeof import('osm-api')
  return {
    ...actual,
    uploadChangeset: mockUploadChangeset,
  }
})

import { type ChangesStore } from '@osm-editor-kit/osm-changeset'
import { type OsmWay } from '@osm-editor-kit/osm-data'
import { uploadChangeset } from 'osm-api'
import { createOsmOAuthClient, OsmApiRequestError } from '../osm-oauth-client'

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

const { uploadChanges } = createOsmOAuthClient(
  {
    userAgent: 'PLanes/0.9.0',
    scopes: ['read_prefs', 'write_api'],
    getClientId: () => 'test-client-id',
    getRedirectUrl: () => 'https://example.com/osm-oauth-land.html',
    getApiUrl: (useDev) =>
      useDev ? 'https://master.apis.dev.openstreetmap.org' : 'https://api.openstreetmap.org',
  },
  { changesetTags: { comment: 'Parking lanes' } },
)

describe('uploadChanges', () => {
  beforeEach(() => {
    mockUploadChangeset.mockReset()
    const location: Pick<Location, 'origin' | 'pathname'> = {
      origin: 'https://example.com',
      pathname: '/lanes/',
    }
    global.window = { location } as Window & typeof globalThis
  })

  test('calls uploadChangeset with tags and diff without real network', async () => {
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

  test('wraps osm-api errors as OsmApiRequestError', async () => {
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

void uploadChangeset
void OsmApiRequestError
