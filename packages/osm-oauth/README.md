# `@osm-editor-kit/osm-oauth`

**Status:** Private (monorepo-only). Eventual npm alpha planned.

## What it does

OAuth 2.0 login and OSM API access for browser editors. Wraps [`osm-api`](https://www.npmjs.com/package/osm-api) with a `createOsmOAuthClient` factory for authenticate / restore / logout, user profile, and changeset upload from a `@osm-editor-kit/osm-changeset` `ChangesStore`. Supports redirect-based OAuth (PKCE) with return-URL persistence so map deep links survive login, plus helpers for the `osm-oauth-land.html` callback page and stripping OAuth query params without dropping `map` / `f` params.

## Usage

```ts
import {
  createOsmOAuthClient,
  clearOauthCallbackSearchParams,
  pickOauthCallbackSearch,
} from '@osm-editor-kit/osm-oauth'

const client = createOsmOAuthClient(
  {
    userAgent: 'MyEditor/1.0',
    scopes: ['read_prefs', 'write_api'],
    getClientId: (useDevServer) => (useDevServer ? DEV_CLIENT_ID : PROD_CLIENT_ID),
    getRedirectUrl: () => `${window.location.origin}/osm-oauth-land.html`,
    getApiUrl: (useDevServer) =>
      useDevServer ? 'https://master.apis.dev.openstreetmap.org' : 'https://api.openstreetmap.org',
    getUseDevServer: () => false,
    getLoginMode: () => 'redirect', // popup breaks on openstreetmap.org COOP
  },
  { changesetTags: { comment: 'MyEditor' } },
)

await client.restoreSession(false) // finish redirect callback if present
await client.authenticate(false)   // start login when needed
const user = await client.userInfo()
const idMap = await client.uploadChanges('MyEditor', '1.0', changesStore, {
  comment: 'Fix lane tags',
})
client.logout()

// After OAuth redirect lands on the app:
clearOauthCallbackSearchParams()
pickOauthCallbackSearch(location.search) // router redirect helper
```

Depends on `@osm-editor-kit/osm-changeset` and `osm-api`. Upload failures surface as `OsmApiRequestError`.
