import type { OsmTags } from '@osm-editor-kit/osm-data'

export type WidthInfraClass = 'car' | 'bicycle' | 'other'

const carHighwayRegex =
  /^motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street/

/** Classify OSM way tags for width-mode visual focus (map style only). */
export function classifyWidthInfra(tags: OsmTags): WidthInfraClass {
  const highway = tags.highway
  if (!highway) return 'other'

  if (highway === 'cycleway') return 'bicycle'

  if (highway === 'path' || highway === 'footway') {
    const bicycle = tags.bicycle
    if (bicycle === 'designated' || bicycle === 'yes') return 'bicycle'
    return 'other'
  }

  if (carHighwayRegex.test(highway)) return 'car'

  return 'other'
}
