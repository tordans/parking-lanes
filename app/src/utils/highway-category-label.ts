/** English labels for OSM `highway=*` street categories shown in mode panel intros. */
const highwayCategoryLabels: Record<string, string> = {
  motorway: 'Motorway',
  motorway_link: 'Motorway link',
  trunk: 'Trunk road',
  trunk_link: 'Trunk link',
  primary: 'Primary road',
  primary_link: 'Primary link',
  secondary: 'Secondary road',
  secondary_link: 'Secondary link',
  tertiary: 'Tertiary road',
  tertiary_link: 'Tertiary link',
  unclassified: 'Unclassified road',
  residential: 'Residential road',
  living_street: 'Living street',
  service: 'Service road',
  road: 'Road',
  track: 'Track',
  path: 'Path',
  footway: 'Footway',
  cycleway: 'Cycleway',
  pedestrian: 'Pedestrian way',
  bridleway: 'Bridleway',
  steps: 'Steps',
}

function humanizeHighwayTag(highway: string): string {
  return highway
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function highwayCategoryLabel(highway: string | undefined): string | null {
  if (!highway) return null
  return highwayCategoryLabels[highway] ?? humanizeHighwayTag(highway)
}
