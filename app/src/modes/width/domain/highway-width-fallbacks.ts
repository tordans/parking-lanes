// Ported from tilda-geo-cqi `highway_width_fallbacks.lua`; edit tables here when TILDA changes.

export const DEFAULT_FALLBACK = 10

// INFERRED (needs review): interpolated from parking primary/secondary ladder (+4 two-way / +3 oneway steps)
export const HIGHWAY_WIDTH_NO_ONEWAY: Record<string, number> = {
  motorway: 22,
  trunk: 20,
  primary: 18,
  secondary: 14,
  tertiary: 10,
  motorway_link: 9,
  trunk_link: 9,
  primary_link: 6,
  secondary_link: 6,
  tertiary_link: 6,
  residential: 8,
  unclassified: 8,
  living_street: 5,
  pedestrian: 8,
  road: 8,
  service: 4,
  bus_guideway: 3,
  track: 2.5,
  footway: 2.5,
  // INFERRED (needs review): match footway / track tier
  path: 2.5,
  bridleway: 2.5,
  // INFERRED (needs review): below footway (2.5)
  cycleway: 2,
  steps: 2,
}

export const HIGHWAY_WIDTH_ONEWAY: Record<string, number> = {
  motorway: 15,
  trunk: 15,
  primary: 12,
  secondary: 9,
  tertiary: 7,
  motorway_link: 9,
  trunk_link: 9,
  primary_link: 6,
  secondary_link: 6,
  tertiary_link: 6,
  residential: 8,
  unclassified: 8,
  living_street: 5,
  pedestrian: 8,
  road: 8,
  service: 4,
  bus_guideway: 3,
  track: 2.5,
  footway: 2.5,
  // INFERRED (needs review): match footway / track tier
  path: 2.5,
  bridleway: 2.5,
  // INFERRED (needs review): below footway (2.5)
  cycleway: 2,
  steps: 2,
}

export type HighwayWidthFallbackSource = 'highway_default' | 'highway_default_and_oneway'

export type HighwayWidthFallback = {
  value: number
  source: HighwayWidthFallbackSource
}

/** Whether motor traffic is one-way — from raw OSM tags (not TILDA-derived oneway). */
export function isOnewayFromOsmTags(tags: {
  oneway?: string
  'oneway:bicycle'?: string
  highway?: string
  junction?: string
}): boolean {
  const oneway = tags.oneway
  const onewayBicycle = tags['oneway:bicycle']

  if (onewayBicycle === 'yes') return true
  if (onewayBicycle === 'no') {
    return oneway === 'yes' || oneway === '-1'
  }

  if (oneway === 'yes' || oneway === '-1') return true
  if (oneway === 'no') return false

  if (tags.junction === 'roundabout') return true
  if (tags.highway === 'motorway' || tags.highway === 'motorway_link') return true

  return false
}

export function deriveHighwayWidthFallback(
  highway: string | undefined,
  isOneway: boolean,
): HighwayWidthFallback {
  const widthOneway = highway ? HIGHWAY_WIDTH_ONEWAY[highway] : undefined
  const widthNoOneway = highway ? HIGHWAY_WIDTH_NO_ONEWAY[highway] : undefined

  if (isOneway) {
    return {
      value: widthOneway ?? DEFAULT_FALLBACK,
      source: widthOneway === widthNoOneway ? 'highway_default' : 'highway_default_and_oneway',
    }
  }

  return {
    value: widthNoOneway ?? DEFAULT_FALLBACK,
    source: 'highway_default',
  }
}
