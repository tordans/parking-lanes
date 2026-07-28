import { isLoggedIn } from 'osm-api'

export const OSM_AUTH_TEMP_KEY = '__osmAuthTemp'
export const OSM_AUTH_KEY = '__osmAuth'
/** Same-origin path(+search+hash) to restore after redirect login. Used by osm-oauth-land.html. */
export const OSM_AUTH_RETURN_URL_KEY = '__osmAuthReturnUrl'

export const OAUTH_CALLBACK_PARAM_KEYS = ['code', 'state', 'error', 'error_description'] as const

type OsmAuthTransaction = {
  state: string
  pkceVerifier: string
  options: {
    clientId: string
    redirectUrl: string
    scopes: string[]
  }
}

function getOAuthBaseUrl(apiUrl: string): string {
  if (apiUrl === 'https://api.openstreetmap.org') return 'https://www.openstreetmap.org'
  return apiUrl
}

/** Persist current location so redirect login can restore map deep links (f, map, mode). */
export function saveOAuthReturnUrl(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    OSM_AUTH_RETURN_URL_KEY,
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  )
}

/**
 * Resolve where osm-oauth-land.html should send the browser after OSM redirects back.
 * Must stay under the land page directory (Vite base). Never use `..` — for a file URL
 * like `/street-space-editor/osm-oauth-land.html`, `new URL('..', href)` is the host root.
 * Keep in sync with `app/public/osm-oauth-land.html`.
 */
export function resolveOAuthLandReturnUrl(options: {
  landHref: string
  returnPath: string | null
  callbackSearch: string
}): string {
  const appBase = new URL('.', options.landHref)
  const appBasePrefix = appBase.pathname.replace(/\/$/, '') || ''

  let appUrl = new URL(appBase.href)
  if (options.returnPath) {
    try {
      const candidate = new URL(options.returnPath, appBase.origin)
      const underBase =
        candidate.origin === appBase.origin &&
        (appBasePrefix === '' ||
          candidate.pathname === appBasePrefix ||
          candidate.pathname.startsWith(`${appBasePrefix}/`))
      if (underBase) appUrl = candidate
    } catch {
      // keep appBase
    }
  }

  const params = new URLSearchParams(
    options.callbackSearch.startsWith('?')
      ? options.callbackSearch.slice(1)
      : options.callbackSearch,
  )
  for (const key of OAUTH_CALLBACK_PARAM_KEYS) {
    const value = params.get(key)
    if (value) appUrl.searchParams.set(key, value)
    else appUrl.searchParams.delete(key)
  }

  return `${appUrl.pathname}${appUrl.search}${appUrl.hash}`
}

/**
 * osm-api's authReady may exchange the redirect code before configure() runs.
 * Retry here once the correct API base URL is known.
 */
export async function completeOAuthRedirectIfNeeded(apiUrl: string): Promise<void> {
  if (typeof window === 'undefined' || isLoggedIn()) return

  const callbackHref = window.location.href
  if (!callbackHref) return

  const callbackUrl = new URL(callbackHref)
  const code = callbackUrl.searchParams.get('code')
  if (!code) return

  const loginStateRaw = localStorage.getItem(OSM_AUTH_TEMP_KEY)
  if (!loginStateRaw) return

  let transaction: OsmAuthTransaction
  try {
    transaction = JSON.parse(loginStateRaw) as OsmAuthTransaction
  } catch {
    return
  }

  const error = callbackUrl.searchParams.get('error_description')
  if (error) throw new Error(error)

  const responseState = callbackUrl.searchParams.get('state')
  if (!transaction.pkceVerifier || !transaction.state) throw new Error('No login in progress')
  if (transaction.state !== responseState) throw new Error('State Mismatch')

  const qs = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: transaction.options.redirectUrl,
    client_id: transaction.options.clientId,
    code_verifier: transaction.pkceVerifier,
  }

  const tokenUrl = `${getOAuthBaseUrl(apiUrl)}/oauth2/token?${new URLSearchParams(qs).toString()}`
  const response = await fetch(tokenUrl, {
    method: 'POST',
    body: '',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  const exchangeResponse = (await response.json()) as {
    error_description?: string
    created_at: number
    access_token: string
    scope: string
  }

  if (exchangeResponse.error_description) throw new Error(exchangeResponse.error_description)

  localStorage.setItem(
    OSM_AUTH_KEY,
    JSON.stringify({
      issuedAt: new Date(exchangeResponse.created_at * 1000).toISOString(),
      accessToken: exchangeResponse.access_token,
      scopes: exchangeResponse.scope.split(' '),
    }),
  )
  localStorage.removeItem(OSM_AUTH_TEMP_KEY)
}

/** Drop OAuth callback keys only — keep map / f / focus deep-link params. */
export function clearOauthCallbackSearchParams(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  let changed = false
  for (const key of OAUTH_CALLBACK_PARAM_KEYS) {
    if (!url.searchParams.has(key)) continue
    url.searchParams.delete(key)
    changed = true
  }
  if (!changed) return

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

/** Pick OAuth callback params from a query string for router redirects. */
export function pickOauthCallbackSearch(
  searchStr: string,
): Partial<Record<(typeof OAUTH_CALLBACK_PARAM_KEYS)[number], string>> {
  const params = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr)
  const out: Partial<Record<(typeof OAUTH_CALLBACK_PARAM_KEYS)[number], string>> = {}
  for (const key of OAUTH_CALLBACK_PARAM_KEYS) {
    const value = params.get(key)
    if (value) out[key] = value
  }
  return out
}
