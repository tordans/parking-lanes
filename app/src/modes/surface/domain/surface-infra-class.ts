import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { SidepathPrefix } from '@osm-editor-kit/osm-sidepath-tags'

export type SurfaceInfraClass = 'roads' | 'path' | 'sidewalks' | 'bike'

const carHighwayRegex =
  /^motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street/

/** Classify OSM way tags for surface-mode visual focus (map style only). */
export function classifySurfaceInfra(
  tags: OsmTags,
  opts?: { prefix?: SidepathPrefix },
): SurfaceInfraClass {
  if (opts?.prefix === 'sidewalk') return 'sidewalks'
  if (opts?.prefix === 'cycleway') return 'bike'

  const highway = tags.highway
  if (!highway) return 'roads'

  if (highway === 'cycleway') return 'bike'

  if (highway === 'path' || highway === 'footway') {
    const bicycle = tags.bicycle
    if (bicycle === 'designated' || bicycle === 'yes') return 'bike'
    if (highway === 'footway') return 'sidewalks'
    return 'path'
  }

  if (carHighwayRegex.test(highway)) return 'roads'

  return 'path'
}
