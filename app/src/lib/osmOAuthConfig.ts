import { OSM_APP_EDITOR } from './app-identity'

export { OSM_APP_EDITOR }
export const OSM_API_USER_AGENT = OSM_APP_EDITOR

/** Must match copied land-page filename and OAuth app redirect URIs on openstreetmap.org */
export const OSM_OAUTH_LAND_FILENAME = 'osm-oauth-land.html'

export const OSM_OAUTH_SCOPES = ['read_prefs', 'write_api'] as const

function readOsmOAuthClientId(key: 'OSM_OAUTH_CLIENT_ID' | 'OSM_OAUTH_CLIENT_ID_DEV'): string {
  const value = import.meta.env[key]?.trim()
  if (!value) {
    throw new Error(
      `Missing ${key}. Copy .env.example to .env at the repo root and set your OAuth client ID.`,
    )
  }
  return value
}

export function getOsmOAuthClientId(useDevServer = false): string {
  return readOsmOAuthClientId(useDevServer ? 'OSM_OAUTH_CLIENT_ID_DEV' : 'OSM_OAUTH_CLIENT_ID')
}

function getAppBasePath(): string {
  const { pathname } = window.location
  if (pathname === '/' || pathname.endsWith('/')) return pathname.endsWith('/') ? pathname : '/'

  const lastSlash = pathname.lastIndexOf('/')
  return pathname.slice(0, lastSlash + 1)
}

/**
 * Redirect URI for OAuth popup: origin + app base path + {@link OSM_OAUTH_LAND_FILENAME}.
 * Register the resulting URLs on your OSM OAuth application (see `.env.example`).
 */
export function getOsmOAuthRedirectUrl(): string {
  return new URL(OSM_OAUTH_LAND_FILENAME, `${window.location.origin}${getAppBasePath()}`).href
}

export function isOsmOAuthConfigured(): boolean {
  return Boolean(import.meta.env.OSM_OAUTH_CLIENT_ID?.trim())
}
