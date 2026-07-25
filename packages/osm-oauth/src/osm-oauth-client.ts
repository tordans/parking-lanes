import {
  applyUploadResult,
  buildChangesetTags,
  changesStoreToOsmChange,
  type BuildChangesetTagsOptions,
  type ChangedIdMap,
  type ChangesStore,
} from '@osm-editor-kit/osm-changeset'
import {
  authReady,
  configure,
  getAuthToken,
  getUser,
  isLoggedIn,
  login as osmLogin,
  logout as osmLogout,
  uploadChangeset,
} from 'osm-api'

type OsmLoginOptions = Parameters<typeof osmLogin>[0]
type OsmLoginMode = OsmLoginOptions['mode']

const AUTH_SERVER_STORAGE_KEY = '__osmAuthServer'

export interface OsmOAuthConfig {
  userAgent: string
  scopes: OsmLoginOptions['scopes']
  getClientId: (useDevServer: boolean) => string
  getRedirectUrl: () => string
  getApiUrl: (useDevServer: boolean) => string
  /** Current UI toggle — used so uploads/profile calls match the selected OSM server. */
  getUseDevServer?: () => boolean
  getLoginMode?: () => OsmLoginMode
}

export interface OsmUploadConfig {
  changesetTags?: BuildChangesetTagsOptions
}

export class OsmApiRequestError extends Error {
  responseText: string

  constructor(responseText: string) {
    super(responseText || 'OSM API request failed')
    this.name = 'OsmApiRequestError'
    this.responseText = responseText
  }
}

function wrapOsmApiError(err: unknown): never {
  if (err instanceof Error && err.message.startsWith('OSM API: '))
    throw new OsmApiRequestError(err.message.slice('OSM API: '.length))

  throw err
}

function readAuthServer(): boolean | null {
  if (typeof localStorage === 'undefined') return null
  const value = localStorage.getItem(AUTH_SERVER_STORAGE_KEY)
  if (value === 'dev') return true
  if (value === 'prod') return false
  return null
}

function writeAuthServer(useDevServer: boolean): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(AUTH_SERVER_STORAGE_KEY, useDevServer ? 'dev' : 'prod')
}

function clearAuthServer(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(AUTH_SERVER_STORAGE_KEY)
}

export interface OsmOAuthClient {
  authenticate: (useDevServer: boolean) => Promise<void>
  restoreSession: (useDevServer: boolean) => Promise<boolean>
  logout: () => void
  userInfo: () => ReturnType<typeof getUser>
  uploadChanges: (
    editorName: string,
    editorVersion: string,
    changesStore: ChangesStore,
    options?: Pick<BuildChangesetTagsOptions, 'comment'>,
  ) => Promise<ChangedIdMap>
}

export function createOsmOAuthClient(
  oauthConfig: OsmOAuthConfig,
  uploadConfig: OsmUploadConfig = {},
): OsmOAuthClient {
  let configuredForDev: boolean | null = null

  function syncAuthHeader(): void {
    const token = getAuthToken()
    configure({ authHeader: token ? `Bearer ${token}` : undefined })
  }

  function ensureOsmApiConfigured(useDevServer: boolean): void {
    if (configuredForDev === useDevServer) {
      syncAuthHeader()
      return
    }

    configure({
      apiUrl: oauthConfig.getApiUrl(useDevServer),
      userAgent: oauthConfig.userAgent,
    })
    configuredForDev = useDevServer
    syncAuthHeader()
  }

  function resolveUseDevServer(override?: boolean): boolean {
    return override ?? oauthConfig.getUseDevServer?.() ?? false
  }

  async function restoreSession(useDevServer: boolean): Promise<boolean> {
    ensureOsmApiConfigured(useDevServer)
    await authReady
    syncAuthHeader()
    if (!isLoggedIn()) return false

    const tokenServer = readAuthServer()
    if (tokenServer === null) {
      // Legacy sessions predate the server stamp — treat as production-only.
      if (useDevServer) {
        osmLogout()
        clearAuthServer()
        syncAuthHeader()
        return false
      }
      writeAuthServer(false)
      return true
    }

    if (tokenServer !== useDevServer) {
      osmLogout()
      clearAuthServer()
      syncAuthHeader()
      return false
    }

    return true
  }

  async function authenticate(useDevServer: boolean): Promise<void> {
    ensureOsmApiConfigured(useDevServer)
    await authReady
    syncAuthHeader()

    const tokenServer = readAuthServer()
    if (isLoggedIn() && tokenServer !== null && tokenServer !== useDevServer) {
      osmLogout()
      clearAuthServer()
      syncAuthHeader()
    }

    if (!isLoggedIn()) {
      await osmLogin({
        mode: oauthConfig.getLoginMode?.() ?? 'popup',
        clientId: oauthConfig.getClientId(useDevServer),
        redirectUrl: oauthConfig.getRedirectUrl(),
        scopes: [...oauthConfig.scopes],
      })
      syncAuthHeader()
    }

    writeAuthServer(useDevServer)
  }

  function logout(): void {
    osmLogout()
    clearAuthServer()
    syncAuthHeader()
  }

  function userInfo() {
    ensureOsmApiConfigured(resolveUseDevServer())
    return getUser('me')
  }

  async function uploadChanges(
    editorName: string,
    editorVersion: string,
    changesStore: ChangesStore,
    options?: Pick<BuildChangesetTagsOptions, 'comment'>,
  ): Promise<ChangedIdMap> {
    try {
      ensureOsmApiConfigured(resolveUseDevServer())
      const tags = buildChangesetTags(editorName, editorVersion, {
        ...uploadConfig.changesetTags,
        ...options,
      })
      const diff = changesStoreToOsmChange(changesStore)
      const result = await uploadChangeset(tags, diff)

      return applyUploadResult(changesStore, result)
    } catch (err) {
      console.error(err)
      wrapOsmApiError(err)
    }
  }

  return {
    authenticate,
    restoreSession,
    logout,
    userInfo,
    uploadChanges,
  }
}
