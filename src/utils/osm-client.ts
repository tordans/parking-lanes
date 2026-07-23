import * as JXON from 'jxon'
import {
    authReady,
    configure,
    getAuthToken,
    getConfig,
    getUser,
    isLoggedIn,
    login as osmLogin,
    logout as osmLogout,
} from 'osm-api'
import {
    getOsmOAuthClientId,
    getOsmOAuthRedirectUrl,
    OSM_API_USER_AGENT,
    OSM_OAUTH_SCOPES,
} from '../lib/osmOAuthConfig'
import { osmDevUrl } from './links'

import { type OsmWay } from './types/osm-data'
import { type ChangedIdMap, type ChangesStore, type JxonOsmWay } from './types/changes-store'

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

interface OsmApiRequestOptions {
    method: string
    path: string
    headers?: Record<string, string>
    content?: string
}

export class OsmApiRequestError extends Error {
    responseText: string

    constructor(responseText: string) {
        super(responseText || 'OSM API request failed')
        this.name = 'OsmApiRequestError'
        this.responseText = responseText
    }
}

async function osmApiRequest(options: OsmApiRequestOptions): Promise<string> {
    syncAuthHeader()
    const { apiUrl, userAgent, authHeader } = getConfig()
    const token = getAuthToken()
    const authorization = authHeader ?? (token ? `Bearer ${token}` : '')

    const response = await fetch(`${apiUrl}${options.path}`, {
        method: options.method,
        headers: {
            ...(authorization ? { Authorization: authorization } : {}),
            'User-Agent': userAgent,
            ...options.headers,
        },
        body: options.content,
    })

    const text = await response.text()
    if (!response.ok)
        throw new OsmApiRequestError(text)

    return text
}

export async function uploadChanges(editorName: string, editorVersion: string, changesStore: ChangesStore): Promise<ChangedIdMap> {
    try {
        const changesetId = await createChangeset(editorName, editorVersion)
        const diffResult = await saveChangesets(changesStore, changesetId, editorName)
        await closeChangeset(changesetId)

        const diffResultJxon: any = JXON.xmlToJs(diffResult)

        const diffWays = Array.isArray(diffResultJxon.diffResult.way) ?
            diffResultJxon.diffResult.way :
            [diffResultJxon.diffResult.way]

        const changedIdMap: ChangedIdMap = {}

        for (const diffWay of diffWays) {
            const oldId = parseInt(diffWay.$old_id)
            const way = changesStore.modify.way.find(x => x.id === oldId) ??
                        changesStore.create.way.find(x => x.id === oldId)
            way!.id = parseInt(diffWay.$new_id)
            way!.version = parseInt(diffWay.$new_version)

            if (diffWay.$old_id !== diffWay.$new_id)
                changedIdMap[diffWay.$old_id] = diffWay.$new_id
        }

        changesStore.modify.way = []
        changesStore.create.way = []

        return changedIdMap
    } catch (err) {
        console.error(err)
        throw err
    }
}

function createChangeset(editorName: string, editorVersion: string): Promise<string> {
    const change = {
        osm: {
            changeset: {
                $version: '0.6',
                $generator: editorName,
                tag: [
                    { $k: 'created_by', $v: `${editorName} ${editorVersion}` },
                    { $k: 'comment', $v: 'Parking lanes' },
                    { $k: 'host', $v: `${window.location.origin}${window.location.pathname}` },
                ],
            },
        },
    }

    return osmApiRequest({
        method: 'PUT',
        path: '/api/0.6/changeset/create',
        headers: { 'Content-Type': 'text/xml' },
        content: JXON.jsToString(change),
    })
}

function saveChangesets(changesStore: ChangesStore, changesetId: string, editorName: string) {
    const change = {
        osmChange: {
            $version: '0.6',
            $generator: editorName,
            modify: {
                way: changesStore.modify.way
                    .map(x => wayToJxon(x, changesetId)),
            },
            create: {
                way: changesStore.create.way
                    .map(x => wayToJxon(x, changesetId)),
            },
        },
    }

    return osmApiRequest({
        method: 'POST',
        path: '/api/0.6/changeset/' + changesetId + '/upload',
        headers: { 'Content-Type': 'text/xml' },
        content: JXON.jsToString(change),
    })
}

function closeChangeset(changesetId: string) {
    return osmApiRequest({
        method: 'PUT',
        path: '/api/0.6/changeset/' + changesetId + '/close',
        headers: { 'Content-Type': 'text/xml' },
    })
}

function wayToJxon(osm: OsmWay, changesetId: string): JxonOsmWay {
    const jxonWay: JxonOsmWay = {
        $id: osm.id,
        $version: osm.version || 0,
        tag: Object.keys(osm.tags)
            .map(k => ({ $k: k, $v: osm.tags[k] })),
        nd: osm.nodes
            .map(id => ({ $ref: id })),
    }

    if (changesetId)
        jxonWay.$changeset = changesetId

    return jxonWay
}
