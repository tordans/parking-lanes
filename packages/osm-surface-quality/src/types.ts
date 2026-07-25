/** Raw OSM tags for surface/smoothness derivation. */
export interface OsmTags {
  [key: string]: string | undefined
}

/** Sentinel mirroring LUA `SANITIZE_VALUES.disallowed`. */
export const DISALLOWED = 'DISALLOWED_VALUE'
