import type { OsmTags } from '@osm-editor-kit/osm-data'

export const BICYCLE_TOP_LEVEL_KEYS = new Set([
  'bicycle',
  'cycleway',
  'foot',
  'is_sidepath',
  'segregated',
  'traffic_sign',
  'surface',
  'smoothness',
])

const BICYCLE_TAG_PATTERN =
  /^(?:cycleway|bicycle|separation|traffic_mode|marking|buffer)(?::(?:left|right|both))?(?::|$)/

export function isBicycleTagKey(key: string): boolean {
  if (BICYCLE_TOP_LEVEL_KEYS.has(key)) return true
  return BICYCLE_TAG_PATTERN.test(key)
}

export function pickBicycleTags(tags: OsmTags): OsmTags {
  const picked: OsmTags = {}
  for (const [key, value] of Object.entries(tags)) {
    if (value !== undefined && isBicycleTagKey(key)) picked[key] = value
  }
  return picked
}

/** Flat keys shown in the sidepath tag editor (nested via nestSideTags). */
export const BICYCLE_FLAT_EDIT_KEYS = [
  'cycleway',
  'lane',
  'segregated',
  'is_sidepath',
  'bicycle',
  'foot',
  'traffic_sign',
  'separation',
  'separation_left',
  'separation_right',
  'traffic_mode',
  'traffic_mode_left',
  'traffic_mode_right',
  'marking',
  'marking_left',
  'marking_right',
  'buffer',
  'buffer_left',
  'buffer_right',
  'surface',
] as const
