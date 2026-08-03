export type TableTagGroupId = 'centerline' | 'bikelane' | 'sidewalk'

export const TABLE_TAG_GROUP_ORDER: readonly TableTagGroupId[] = [
  'centerline',
  'bikelane',
  'sidewalk',
] as const

export const DEFAULT_TABLE_GROUP_OPEN: Record<TableTagGroupId, boolean> = {
  centerline: true,
  bikelane: true,
  sidewalk: true,
}

/**
 * Classify an OSM tag key into a table disclosure group.
 *
 * - All cycleway* + bicycle / bicycle:* → bikelane (left/right/both together)
 * - All sidewalk* + foot / foot:* → sidewalk (left/right/both together)
 * - Everything else (incl. oneway + oneway:bicycle) → centerline
 */
export function classifyTagKey(key: string): TableTagGroupId {
  if (
    /^(?:source:)?cycleway(?::|$)/.test(key) ||
    /^note:cycleway(?::|$)/.test(key) ||
    /^bicycle(?::|$)/.test(key)
  ) {
    return 'bikelane'
  }

  if (
    /^(?:source:)?sidewalk(?::|$)/.test(key) ||
    /^note:sidewalk(?::|$)/.test(key) ||
    /^foot(?::|$)/.test(key)
  ) {
    return 'sidewalk'
  }

  return 'centerline'
}
