import type { MapBounds } from '@osm-editor-kit/osm-data'

/** OSM Map API bbox for the local dev fixture (west,south,east,north). */
export const DEV_OSM_FIXTURE_BBOX: MapBounds = {
  west: 13.449,
  south: 52.4735,
  east: 13.455,
  north: 52.4775,
}

/** Relative to the `app/` package root — gitignored, created by `predev`. */
export const DEV_OSM_FIXTURE_RELATIVE_PATH = 'src/modes/parking/fixtures/dev-map-bbox.json'

export function devOsmFixtureBboxParam(): string {
  const { west, south, east, north } = DEV_OSM_FIXTURE_BBOX
  return `${west},${south},${east},${north}`
}
