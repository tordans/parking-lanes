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

/** Shared flat keys (not left/right-qualified). */
export const BICYCLE_COMMON_EDIT_KEYS = [
  'cycleway',
  'lane',
  'segregated',
  'is_sidepath',
  'bicycle',
  'foot',
  'traffic_sign',
  'separation',
  'traffic_mode',
  'marking',
  'buffer',
  'surface',
] as const

/** Left-edge keys on a cycleway/footway feature (TILDA `*_left`). */
export const BICYCLE_LEFT_EDIT_KEYS = [
  'separation_left',
  'traffic_mode_left',
  'marking_left',
  'buffer_left',
] as const

/** Right-edge keys on a cycleway/footway feature (TILDA `*_right`). */
export const BICYCLE_RIGHT_EDIT_KEYS = [
  'separation_right',
  'traffic_mode_right',
  'marking_right',
  'buffer_right',
] as const

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

export type BicycleTagBoxSide = 'left' | 'right' | 'both'
