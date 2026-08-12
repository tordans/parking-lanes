---
"@osm-editor-kit/osm-oauth": minor
---

Pending npm alpha packaging (not in the first publish wave). Documents the kit package as it exists today.

Core features to date:
- `createOsmOAuthClient` factory for OAuth login, session restore, logout, user profile, and changeset upload via `osm-api`
- Redirect-based OAuth flow with return-URL persistence so map deep links survive login
- `osm-oauth-land.html` return-URL resolver that keeps OAuth callback params under the Vite app base
- OAuth callback query helpers: pick callback params for router redirects, clear them without dropping `map` / `f` deep links
- PKCE redirect completion fallback when `osm-api` `authReady` runs before the API base URL is configured
- Production vs dev OSM server toggle with localStorage-stored token server binding and mismatch logout
- Upload `ChangesStore` edits as an OSM changeset (tags, diff, post-upload ID map via `@osm-editor-kit/osm-changeset`)
- `OsmApiRequestError` wrapping `osm-api` upload failures for clearer error handling
