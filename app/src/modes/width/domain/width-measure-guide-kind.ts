import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { SidepathPrefix } from '@osm-editor-kit/osm-sidepath-tags'
import { classifyWidthInfra } from './width-infra-class'

export type WidthMeasureGuideKind = 'road' | 'sidewalk' | 'cycleway' | 'other'

const carHighwayRegex =
  /^motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street/

/** Pick the measurement help section for the selected geometry. */
export function widthMeasureGuideKind(options: {
  prefix?: SidepathPrefix
  tags: OsmTags
}): WidthMeasureGuideKind {
  if (options.prefix === 'sidewalk') return 'sidewalk'
  if (options.prefix === 'cycleway') return 'cycleway'

  const highway = options.tags.highway
  if (!highway) return 'other'

  if (highway === 'cycleway') return 'cycleway'
  if (highway === 'footway' || highway === 'pedestrian' || highway === 'steps') return 'sidewalk'

  if (highway === 'path') {
    const bicycle = options.tags.bicycle
    if (bicycle === 'designated' || bicycle === 'yes') return 'cycleway'
    const foot = options.tags.foot
    if (foot === 'designated' || foot === 'yes' || foot == null) return 'sidewalk'
    return 'other'
  }

  if (carHighwayRegex.test(highway)) return 'road'

  // Fallback for uncommon highway values still classified as car/bicycle on the map.
  const infra = classifyWidthInfra(options.tags)
  if (infra === 'car') return 'road'
  if (infra === 'bicycle') return 'cycleway'
  return 'other'
}
