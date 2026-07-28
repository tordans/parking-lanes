/** Product identity for UI, OSM `created_by`, and HTTP User-Agent. */
export const APP_NAME = 'Street Space Editor'

/**
 * Semver from `app/package.json`, injected by Vite at build time.
 * `typeof` guards bun tests (no Vite `define`).
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.9.0'

/** Git HEAD author date (`YYYY-MM-DD`) at build time. */
export const APP_BUILD_DATE: string =
  typeof __APP_BUILD_DATE__ !== 'undefined' ? __APP_BUILD_DATE__ : '1970-01-01'

/** Compact token for User-Agent product/version (no spaces). */
export const APP_USER_AGENT_TOKEN = 'StreetSpaceEditor'

export const APP_REPO_URL = 'https://github.com/osmberlin/street-space-editor'

export const APP_CHANGELOG_URL = `${APP_REPO_URL}/blob/main/CHANGELOG.md`

/** Appended to uploaded changeset comments (Berlin Verkehrswende parking editor). */
export const OSM_CHANGESET_WIKI_URL =
  'https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Parkraum/Editor'

/** Open a new feedback issue with the mode-feedback template and pre-filled context. */
export function buildModeFeedbackUrl(options: { mode: string; pageUrl: string }): string {
  const params = new URLSearchParams({
    template: 'mode-feedback.yml',
    mode: options.mode,
    'example-url': options.pageUrl,
  })
  return `${APP_REPO_URL}/issues/new?${params.toString()}`
}

/**
 * HTTP User-Agent for OSM API requests (required by API policy).
 * Format: `token/version (repo URL)`.
 * Changeset `created_by` uses `${APP_NAME} ${APP_VERSION}` separately.
 */
export const OSM_APP_EDITOR = `${APP_USER_AGENT_TOKEN}/${APP_VERSION} (${APP_REPO_URL})`
