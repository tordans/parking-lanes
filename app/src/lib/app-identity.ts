/**
 * Product identity for UI, OSM `created_by`, and HTTP User-Agent.
 * Deploy path is `/street-space-editor/`. GitHub remote may still be `street-parking-editor`.
 */
export const APP_NAME = 'Street Space Editor'
export const APP_VERSION = '0.9.0'

/** Compact token for User-Agent product/version (no spaces). */
export const APP_USER_AGENT_TOKEN = 'StreetSpaceEditor'

/** GitHub repo URL — update when the remote is renamed to street-space-editor. */
export const APP_REPO_URL = 'https://github.com/osmberlin/street-parking-editor'

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
 * OSM changeset `created_by` / HTTP User-Agent (required by API policy).
 * Format: `token/version (repo URL)`.
 */
export const OSM_APP_EDITOR = `${APP_USER_AGENT_TOKEN}/${APP_VERSION} (${APP_REPO_URL})`
