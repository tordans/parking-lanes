import type { MapBounds } from '@osm-editor-kit/osm-data'

export function boundsToOverpassBbox(bounds: MapBounds): string {
  return [bounds.south, bounds.west, bounds.north, bounds.east].join(',')
}

export function buildOverpassInterpreterUrl(server: string, query: string): string {
  return server + encodeURIComponent(query)
}
