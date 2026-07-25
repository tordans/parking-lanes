import type { OsmTags } from '@osm-editor-kit/osm-data'

/**
 * Width-mode map filter: skip OSM “link” connectors that are routing glue and
 * almost never carry a real carriageway width.
 *
 * - `highway=*_link` (motorway_link, primary_link, …)
 * - `cycleway=link` / `footway=link` (logical gap-fills between path centerlines)
 */
export function isWidthModeLinkWay(tags: OsmTags | undefined): boolean {
  if (!tags) return false

  const highway = tags.highway
  if (highway != null && highway.endsWith('_link')) return true

  if (tags.cycleway === 'link' || tags.footway === 'link') return true

  return false
}
