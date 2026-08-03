export type TableTagGroupId =
  | 'centerline'
  | 'bikelane'
  | 'bikelane_left'
  | 'bikelane_right'
  | 'sidewalk'
  | 'sidewalk_left'
  | 'sidewalk_right'

export const TABLE_TAG_GROUP_ORDER: readonly TableTagGroupId[] = [
  'centerline',
  'bikelane',
  'bikelane_left',
  'bikelane_right',
  'sidewalk',
  'sidewalk_left',
  'sidewalk_right',
] as const

export const DEFAULT_TABLE_GROUP_OPEN: Record<TableTagGroupId, boolean> = {
  centerline: true,
  bikelane: true,
  bikelane_left: true,
  bikelane_right: true,
  sidewalk: true,
  sidewalk_left: true,
  sidewalk_right: true,
}

function groupFromPrefixSide(
  prefix: string,
  side: string,
): 'bikelane_left' | 'bikelane_right' | 'sidewalk_left' | 'sidewalk_right' | null {
  if (prefix === 'cycleway' && side === 'left') return 'bikelane_left'
  if (prefix === 'cycleway' && side === 'right') return 'bikelane_right'
  if (prefix === 'sidewalk' && side === 'left') return 'sidewalk_left'
  if (prefix === 'sidewalk' && side === 'right') return 'sidewalk_right'
  return null
}

/**
 * Classify an OSM tag key into a table disclosure group.
 *
 * - Left/right cycleway|sidewalk nests → side groups
 * - Bare / :both cycleway (+ bicycle / bicycle:*) → bikelane
 * - Bare / :both sidewalk (+ foot / foot:*) → sidewalk
 * - Everything else (incl. oneway + oneway:bicycle) → centerline
 */
export function classifyTagKey(key: string): TableTagGroupId {
  const noteSide = /^note:(cycleway|sidewalk):(left|right)$/.exec(key)
  if (noteSide) {
    const group = groupFromPrefixSide(noteSide[1]!, noteSide[2]!)
    if (group) return group
  }

  const sideMatch = /^(?:source:)?(cycleway|sidewalk):(left|right)(?::|$)/.exec(key)
  if (sideMatch) {
    const group = groupFromPrefixSide(sideMatch[1]!, sideMatch[2]!)
    if (group) return group
  }

  // Remaining cycleway* (bare, :both, …) after left/right were claimed above.
  if (/^(?:source:)?cycleway(?::|$)/.test(key) || /^note:cycleway(?::|$)/.test(key)) {
    return 'bikelane'
  }
  // Access keys — not oneway:bicycle (that stays with oneway on centerline).
  if (/^bicycle(?::|$)/.test(key)) return 'bikelane'

  if (/^(?:source:)?sidewalk(?::|$)/.test(key) || /^note:sidewalk(?::|$)/.test(key)) {
    return 'sidewalk'
  }
  if (/^foot(?::|$)/.test(key)) return 'sidewalk'

  return 'centerline'
}
