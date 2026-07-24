/**
 * Public OAuth 2 client IDs for this SPA (PKCE; no client secret).
 *
 * Register these redirect URIs on https://www.openstreetmap.org/oauth2/applications:
 *   http://127.0.0.1:33444/osm-oauth-land.html
 *   https://osmberlin.github.io/street-parking-editor/osm-oauth-land.html
 *
 * Required OSM app permissions: read_prefs + write_api only.
 * `openid` ("Sign in with OpenStreetMap") is for using OSM as an OpenID Connect IdP —
 * not required for popup OAuth and Bearer API calls (getUser, uploadChangeset).
 * Do not add openid to requested scopes; enabling it on the OSM app is harmless but unused.
 */
export const OSM_OAUTH_CLIENT_ID = 'WmTSsQVfDq0vkM1tbLahyohhowiL0AWHFFp5u5BkJe4'

/** Dev API OAuth app (api06.dev.openstreetmap.org). */
export const OSM_OAUTH_CLIENT_ID_DEV = 'lX6vX5gKHEfLV9kybjRpy2L7BTqtwZ5c_G7sjKscVw0'
