/**
 * Product identity for UI, OSM `created_by`, and HTTP User-Agent.
 * Deploy path / GitHub repo URLs stay `street-parking-editor` until those are renamed.
 */
export const APP_NAME = 'Street Space Editor'
export const APP_VERSION = '0.9.0'

/** Compact token for User-Agent product/version (no spaces). */
export const APP_USER_AGENT_TOKEN = 'StreetSpaceEditor'

/** GitHub repo URL — update when the remote is renamed. */
export const APP_REPO_URL = 'https://github.com/osmberlin/street-parking-editor'

/**
 * OSM changeset `created_by` / HTTP User-Agent (required by API policy).
 * Format: `token/version (repo URL)`.
 */
export const OSM_APP_EDITOR = `${APP_USER_AGENT_TOKEN}/${APP_VERSION} (${APP_REPO_URL})`
