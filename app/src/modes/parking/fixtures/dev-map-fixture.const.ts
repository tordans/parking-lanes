import type { MapBounds } from '@osm-editor-kit/osm-data'

/**
 * OSM Map API bboxes for the local dev fixture (west,south,east,north).
 * Non-overlapping regions are merged into one `dev-map-bbox.json` by `predev`.
 */
export const DEV_OSM_FIXTURE_BBOXES: MapBounds[] = [
  { west: 13.4092, south: 52.4598, east: 13.455, north: 52.4816 },
  { west: 13.3916, south: 52.3426, east: 13.4489, north: 52.37 },
]

/** Relative to the `app/` package root — gitignored, created by `predev`. */
export const DEV_OSM_FIXTURE_RELATIVE_PATH = 'src/modes/parking/fixtures/dev-map-bbox.json'

/** Bartastraße — blank-slate test street in the Berlin dev fixture (way/48802137). */
export const DEV_OSM_FIXTURE_TEST_STREET_WAY_ID = 48802137

type OsmFixtureElement = {
  type: string
  id: number
  tags?: Record<string, string>
}

/** Strip editor-owned tags from the dev test street; keep only `highway` and `name`. */
export function sanitizeDevOsmFixtureTestStreet<T extends OsmFixtureElement>(elements: T[]): T[] {
  return elements.map((element) => {
    if (
      element.type !== 'way' ||
      element.id !== DEV_OSM_FIXTURE_TEST_STREET_WAY_ID ||
      !element.tags
    ) {
      return element
    }

    const tags: Record<string, string> = {}
    if (element.tags.highway != null) tags.highway = element.tags.highway
    if (element.tags.name != null) tags.name = element.tags.name
    return { ...element, tags }
  })
}

export function devOsmFixtureBboxParam(bounds: MapBounds): string {
  const { west, south, east, north } = bounds
  return `${west},${south},${east},${north}`
}
