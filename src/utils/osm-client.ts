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
import {
    getOsmOAuthClientId,
    getOsmOAuthRedirectUrl,
    OSM_API_USER_AGENT,
    OSM_OAUTH_SCOPES,
} from '../lib/osmOAuthConfig'
import { osmDevUrl } from './links'

import { applyUploadResult, changesStoreToOsmChange } from './changeset-upload'
import { buildChangesetTags } from './osmUploadChangeset'
import { type ChangedIdMap, type ChangesStore } from './types/changes-store'

const osmProdApiUrl = 'https://api.openstreetmap.org'

let configuredForDev: boolean | null = null

function getOsmApiUrl(useDevServer: boolean): string {
    return useDevServer ? osmDevUrl : osmProdApiUrl
}

function syncAuthHeader(): void {
    const token = getAuthToken()
    configure({ authHeader: token ? `Bearer ${token}` : undefined })
}

function ensureOsmApiConfigured(useDevServer: boolean): void {
    if (configuredForDev === useDevServer)
        return

    configure({
        apiUrl: getOsmApiUrl(useDevServer),
        userAgent: OSM_API_USER_AGENT,
    })
    configuredForDev = useDevServer
    syncAuthHeader()
}

export async function authenticate(useDevServer: boolean): Promise<void> {
    ensureOsmApiConfigured(useDevServer)
    await authReady
    syncAuthHeader()

    if (!isLoggedIn()) {
        await osmLogin({
            mode: 'popup',
            clientId: getOsmOAuthClientId(),
            redirectUrl: getOsmOAuthRedirectUrl(),
            scopes: [...OSM_OAUTH_SCOPES],
        })
        syncAuthHeader()
    }
}

export function logout(): void {
    osmLogout()
    syncAuthHeader()
}

export function userInfo() {
    syncAuthHeader()
    return getUser('me')
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

export async function uploadChanges(editorName: string, editorVersion: string, changesStore: ChangesStore): Promise<ChangedIdMap> {
    try {
        const tags = buildChangesetTags(editorName, editorVersion)
        const diff = changesStoreToOsmChange(changesStore)
        const result = await uploadChangeset(tags, diff)

        return applyUploadResult(changesStore, result)
    } catch (err) {
        console.error(err)
        wrapOsmApiError(err)
    }
}
