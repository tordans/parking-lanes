import * as m from '@app/paraglide/messages'

const highwayCategoryLabelByTag = {
  motorway: m.highway_motorway,
  motorway_link: m.highway_motorway_link,
  trunk: m.highway_trunk,
  trunk_link: m.highway_trunk_link,
  primary: m.highway_primary,
  primary_link: m.highway_primary_link,
  secondary: m.highway_secondary,
  secondary_link: m.highway_secondary_link,
  tertiary: m.highway_tertiary,
  tertiary_link: m.highway_tertiary_link,
  unclassified: m.highway_unclassified,
  residential: m.highway_residential,
  living_street: m.highway_living_street,
  service: m.highway_service,
  road: m.highway_road,
  track: m.highway_track,
  path: m.highway_path,
  footway: m.highway_footway,
  cycleway: m.highway_cycleway,
  pedestrian: m.highway_pedestrian,
  bridleway: m.highway_bridleway,
  steps: m.highway_steps,
} as const satisfies Record<string, () => string>

function humanizeHighwayTag(highway: string): string {
  return highway
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function highwayCategoryLabel(highway: string | undefined): string | null {
  if (!highway) return null

  const label = highwayCategoryLabelByTag[highway as keyof typeof highwayCategoryLabelByTag]
  return label?.() ?? humanizeHighwayTag(highway)
}
