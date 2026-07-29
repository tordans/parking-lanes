/** JOSM remote-control base for `import?url=` (Overpass / map download). */
export const josmRemoteBase = 'http://127.0.0.1:8111'
/** @deprecated Prefer `josmImportUrl` / `josmLoadObjectUrl`; kept for existing callers. */
export const josmUrl = `${josmRemoteBase}/import?url=`

export const osmProdUrl = 'https://www.openstreetmap.org'
/** Production OSM API host (OAuth, map downloads, changeset upload). */
export const osmProdApiUrl = 'https://api.openstreetmap.org'
export const osmDevUrl = 'https://master.apis.dev.openstreetmap.org'

export const osmchaBase = 'https://osmcha.org'
export const tildaGeoBase = 'https://tilda-geo.de'
export const osmDeepHistoryBase = 'https://osmlab.github.io/osm-deep-history'
