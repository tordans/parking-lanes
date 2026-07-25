/**
 * Public OAuth 2 client IDs for this SPA (PKCE; no client secret).
 * See `.env.example` for redirect URI lists.
 *
 * Production — https://www.openstreetmap.org/oauth2/applications:
 *   http://127.0.0.1:33444/street-space-editor/osm-oauth-land.html
 *   https://osmberlin.github.io/street-space-editor/osm-oauth-land.html
 *
 * Dev API (Debug → "Use OSM dev server") — separate registry:
 *   https://master.apis.dev.openstreetmap.org/oauth2/applications
 * Same redirect paths must be registered on that app.
 *
 * Required scopes: read_prefs + write_api only.
 */
export const OSM_OAUTH_CLIENT_ID = 'WmTSsQVfDq0vkM1tbLahyohhowiL0AWHFFp5u5BkJe4'

/** Dev API OAuth app (master.apis.dev.openstreetmap.org). */
export const OSM_OAUTH_CLIENT_ID_DEV = 'lX6vX5gKHEfLV9kybjRpy2L7BTqtwZ5c_G7sjKscVw0'
