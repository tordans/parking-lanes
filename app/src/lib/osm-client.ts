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
  },
  { changesetTags: { comment: 'Parking lanes' } },
)

export const { authenticate, logout, userInfo, uploadChanges } = client
export { OsmApiRequestError } from '@osm-editor-kit/osm-oauth'
