import { beforeEach, describe, expect, mock, test } from 'bun:test'

const mockUploadChangeset = mock(() => Promise.resolve({}))
const mockConfigure = mock(() => undefined)
const mockGetAuthToken = mock(() => undefined as string | undefined)
const mockIsLoggedIn = mock(() => false)
const mockGetUser = mock(() => Promise.resolve({ display_name: 'test' }))
const mockOsmLogout = mock(() => undefined)
const mockOsmLogin = mock(() => Promise.resolve())

const memoryStorage = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, value)
  },
  removeItem: (key: string) => {
    memoryStorage.delete(key)
  },
  clear: () => {
    memoryStorage.clear()
  },
}

mock.module('osm-api', () => {
  const actual = require('osm-api') as typeof import('osm-api')
  return {
    ...actual,
    uploadChangeset: mockUploadChangeset,
    configure: mockConfigure,
    getAuthToken: mockGetAuthToken,
    isLoggedIn: mockIsLoggedIn,
    getUser: mockGetUser,
    authReady: Promise.resolve(),
    login: mockOsmLogin,
    logout: mockOsmLogout,
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

describe('uploadChanges', () => {
  let useDevServer = false

  const { uploadChanges, authenticate, restoreSession, logout } = createOsmOAuthClient(
    {
      userAgent: 'StreetSpaceEditor/0.9.0',
      scopes: ['read_prefs', 'write_api'],
      getClientId: (dev) => (dev ? 'dev-client' : 'prod-client'),
      getRedirectUrl: () => 'https://example.com/osm-oauth-land.html',
      getApiUrl: (useDev) =>
        useDev ? 'https://master.apis.dev.openstreetmap.org' : 'https://api.openstreetmap.org',
      getUseDevServer: () => useDevServer,
    },
    { changesetTags: { comment: 'Street Space Editor' } },
  )

  beforeEach(() => {
    useDevServer = false
    mockUploadChangeset.mockReset()
    mockConfigure.mockClear()
    mockGetAuthToken.mockReset()
    mockIsLoggedIn.mockReset()
    mockGetUser.mockReset()
    mockOsmLogout.mockClear()
    mockOsmLogin.mockClear()
    mockGetAuthToken.mockReturnValue(undefined)
    mockIsLoggedIn.mockReturnValue(false)
    memoryStorage.clear()
    ;(globalThis as { localStorage: typeof localStorageMock }).localStorage = localStorageMock
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

    const changedIdMap = await uploadChanges('Street Space Editor', '0.9.0', store, {
      comment: 'Update street space parking for ways Hauptstraße',
    })

    expect(mockUploadChangeset).toHaveBeenCalledTimes(1)
    expect(mockUploadChangeset).toHaveBeenCalledWith(
      {
        created_by: 'Street Space Editor 0.9.0',
        comment: 'Update street space parking for ways Hauptstraße',
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

  test('configures the OSM API URL from getUseDevServer before upload', async () => {
    useDevServer = true
    mockUploadChangeset.mockResolvedValue({
      1: { diffResult: { way: { 1: { newId: 1, newVersion: 2 } } } },
    })

    await uploadChanges('Street Space Editor', '0.9.0', {
      modify: { way: [createWay(1)] },
      create: { way: [] },
    })

    expect(mockConfigure).toHaveBeenCalledWith(
      expect.objectContaining({
        apiUrl: 'https://master.apis.dev.openstreetmap.org',
      }),
    )
  })

  test('wraps osm-api errors as OsmApiRequestError', async () => {
    mockUploadChangeset.mockRejectedValue(new Error('OSM API: changeset required'))

    const store: ChangesStore = {
      modify: { way: [createWay(1)] },
      create: { way: [] },
    }

    await expect(uploadChanges('Street Space Editor', '0.9.0', store)).rejects.toMatchObject({
      name: 'OsmApiRequestError',
      responseText: 'changeset required',
    })
  })

  test('restoreSession rejects a production token when the toggle is on', async () => {
    mockIsLoggedIn.mockReturnValue(true)
    mockGetAuthToken.mockReturnValue('prod-token')
    localStorage.setItem('__osmAuthServer', 'prod')

    await expect(restoreSession(true)).resolves.toBe(false)
    expect(localStorage.getItem('__osmAuthServer')).toBeNull()
    expect(mockOsmLogout).toHaveBeenCalled()
  })

  test('authenticate stamps the selected server', async () => {
    mockIsLoggedIn.mockReturnValue(false)
    await authenticate(true)
    expect(localStorage.getItem('__osmAuthServer')).toBe('dev')
    logout()
    expect(localStorage.getItem('__osmAuthServer')).toBeNull()
  })
})

void uploadChangeset
void OsmApiRequestError
