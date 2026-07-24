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

export interface OsmOAuthConfig {
  userAgent: string
  scopes: OsmLoginOptions['scopes']
  getClientId: (useDevServer: boolean) => string
  getRedirectUrl: () => string
  getApiUrl: (useDevServer: boolean) => string
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

export interface OsmOAuthClient {
  authenticate: (useDevServer: boolean) => Promise<void>
  restoreSession: (useDevServer: boolean) => Promise<boolean>
  logout: () => void
  userInfo: () => ReturnType<typeof getUser>
  uploadChanges: (
    editorName: string,
    editorVersion: string,
    changesStore: ChangesStore,
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
    if (configuredForDev === useDevServer) return

    configure({
      apiUrl: oauthConfig.getApiUrl(useDevServer),
      userAgent: oauthConfig.userAgent,
    })
    configuredForDev = useDevServer
    syncAuthHeader()
  }

  async function restoreSession(useDevServer: boolean): Promise<boolean> {
    ensureOsmApiConfigured(useDevServer)
    await authReady
    syncAuthHeader()
    return isLoggedIn()
  }

  async function authenticate(useDevServer: boolean): Promise<void> {
    ensureOsmApiConfigured(useDevServer)
    await authReady
    syncAuthHeader()

    if (!isLoggedIn()) {
      await osmLogin({
        mode: oauthConfig.getLoginMode?.() ?? 'popup',
        clientId: oauthConfig.getClientId(useDevServer),
        redirectUrl: oauthConfig.getRedirectUrl(),
        scopes: [...oauthConfig.scopes],
      })
      syncAuthHeader()
    }
  }

  function logout(): void {
    osmLogout()
    syncAuthHeader()
  }

  function userInfo() {
    syncAuthHeader()
    return getUser('me')
  }

  async function uploadChanges(
    editorName: string,
    editorVersion: string,
    changesStore: ChangesStore,
  ): Promise<ChangedIdMap> {
    try {
      const tags = buildChangesetTags(editorName, editorVersion, uploadConfig.changesetTags)
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
