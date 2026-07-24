import { osmDevUrl } from '@osm-editor-kit/osm-editor-links'
import { createOsmOAuthClient } from '@osm-editor-kit/osm-oauth'
import {
  getOsmOAuthClientId,
  getOsmOAuthRedirectUrl,
  OSM_API_USER_AGENT,
  OSM_OAUTH_SCOPES,
} from './osmOAuthConfig'

const osmProdApiUrl = 'https://api.openstreetmap.org'

const client = createOsmOAuthClient(
  {
    userAgent: OSM_API_USER_AGENT,
    scopes: OSM_OAUTH_SCOPES,
    getClientId: getOsmOAuthClientId,
    getRedirectUrl: getOsmOAuthRedirectUrl,
    getApiUrl: (useDevServer) => (useDevServer ? osmDevUrl : osmProdApiUrl),
    getLoginMode: () => (import.meta.env.DEV ? 'redirect' : 'popup'),
  },
  { changesetTags: { comment: 'Street Space Editor' } },
)

export const { authenticate, restoreSession, logout, userInfo, uploadChanges } = client
export { OsmApiRequestError } from '@osm-editor-kit/osm-oauth'
