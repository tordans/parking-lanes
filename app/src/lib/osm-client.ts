import { osmDevUrl, osmProdApiUrl } from '@osm-editor-kit/osm-editor-links'
import { createOsmOAuthClient } from '@osm-editor-kit/osm-oauth'
import { getUseOsmDevServer } from '../shell/debug-settings-store'
import { APP_NAME } from './app-identity'
import {
  getOsmOAuthClientId,
  getOsmOAuthRedirectUrl,
  OSM_API_USER_AGENT,
  OSM_OAUTH_SCOPES,
} from './osmOAuthConfig'

const client = createOsmOAuthClient(
  {
    userAgent: OSM_API_USER_AGENT,
    scopes: OSM_OAUTH_SCOPES,
    getClientId: getOsmOAuthClientId,
    getRedirectUrl: getOsmOAuthRedirectUrl,
    getApiUrl: (useDevServer) => (useDevServer ? osmDevUrl : osmProdApiUrl),
    getUseDevServer: getUseOsmDevServer,
    // Always redirect: openstreetmap.org sends COOP: same-origin, which nulls
    // window.opener and breaks osm-api's popup + BroadcastChannel completion.
    getLoginMode: () => 'redirect',
  },
  { changesetTags: { comment: APP_NAME } },
)

export const { authenticate, restoreSession, logout, userInfo, uploadChanges } = client
export { OsmApiRequestError } from '@osm-editor-kit/osm-oauth'
