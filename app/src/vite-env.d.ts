/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OSM_OAUTH_CLIENT_ID: string
  readonly OSM_OAUTH_CLIENT_ID_DEV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
