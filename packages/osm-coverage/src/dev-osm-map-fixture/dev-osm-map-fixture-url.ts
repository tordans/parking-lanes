import type { MapBounds } from '@osm-editor-kit/osm-data'

export const DEV_OSM_MAP_FIXTURE_ROUTE = 'dev-osm-map-fixture'

/** Browser-safe URL for a local dev Map API bbox slice (no Node/fs imports). */
export function devOsmMapFixtureMapUrl(baseUrl: string, bounds: MapBounds): string {
  const base = baseUrl.replace(/\/$/, '')
  const bbox = [bounds.west, bounds.south, bounds.east, bounds.north].join(',')
  return `${base}/${DEV_OSM_MAP_FIXTURE_ROUTE}/api/0.6/map?bbox=${bbox}`
}
