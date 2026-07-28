/// <reference types="vite/client" />

/** Injected by Vite from `app/package.json` + git HEAD date (may be missing under bun test). */
declare const __APP_VERSION__: string | undefined
declare const __APP_BUILD_DATE__: string | undefined

interface ImportMetaEnv {
  readonly OSM_OAUTH_CLIENT_ID: string
  readonly OSM_OAUTH_CLIENT_ID_DEV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
