import { OSM_OAUTH_CLIENT_ID, OSM_OAUTH_CLIENT_ID_DEV } from './osmOAuth.const'

/**
 * OSM changeset `created_by` and HTTP User-Agent (required by API policy).
 * Format: `name/version (repo URL)`.
 */
export const OSM_APP_EDITOR = 'PLanes/0.9.0 (https://github.com/osmberlin/street-parking-editor)'

export const OSM_API_USER_AGENT = OSM_APP_EDITOR

/** Must match copied land-page filename and OAuth app redirect URIs on openstreetmap.org */
export const OSM_OAUTH_LAND_FILENAME = 'osm-oauth-land.html'

export const OSM_OAUTH_SCOPES = ['read_prefs', 'write_api'] as const

export function getOsmOAuthClientId(useDevServer = false): string {
  return useDevServer ? OSM_OAUTH_CLIENT_ID_DEV : OSM_OAUTH_CLIENT_ID
}

function getAppBasePath(): string {
  const { pathname } = window.location
  if (pathname === '/' || pathname.endsWith('/')) return pathname.endsWith('/') ? pathname : '/'

  const lastSlash = pathname.lastIndexOf('/')
  return pathname.slice(0, lastSlash + 1)
}

/**
 * Redirect URI for OAuth popup: origin + app base path + {@link OSM_OAUTH_LAND_FILENAME}.
 * Register the resulting URLs on your OSM OAuth application (see osmOAuth.const.ts).
 */
export function getOsmOAuthRedirectUrl(): string {
  return new URL(OSM_OAUTH_LAND_FILENAME, `${window.location.origin}${getAppBasePath()}`).href
}

export function isOsmOAuthConfigured(): boolean {
  return true
}
