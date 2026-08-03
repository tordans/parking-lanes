export type TableTagGroupId =
  | 'centerline'
  | 'bikelane_left'
  | 'bikelane_right'
  | 'sidewalk_left'
  | 'sidewalk_right'

export const TABLE_TAG_GROUP_ORDER: readonly TableTagGroupId[] = [
  'centerline',
  'bikelane_left',
  'bikelane_right',
  'sidewalk_left',
  'sidewalk_right',
] as const

export const DEFAULT_TABLE_GROUP_OPEN: Record<TableTagGroupId, boolean> = {
  centerline: true,
  bikelane_left: true,
  bikelane_right: true,
  sidewalk_left: true,
  sidewalk_right: true,
}

function groupFromPrefixSide(
  prefix: string,
  side: string,
): Exclude<TableTagGroupId, 'centerline'> | null {
  if (prefix === 'cycleway' && side === 'left') return 'bikelane_left'
  if (prefix === 'cycleway' && side === 'right') return 'bikelane_right'
  if (prefix === 'sidewalk' && side === 'left') return 'sidewalk_left'
  if (prefix === 'sidewalk' && side === 'right') return 'sidewalk_right'
  return null
}

/**
 * Classify an OSM tag key into a table disclosure group.
 * Left/right cycleway|sidewalk nests (incl. source:/note:) go to side groups;
 * everything else (bare keys, :both, other prefixes) is centerline.
 */
export function classifyTagKey(key: string): TableTagGroupId {
  const noteMatch = /^note:(cycleway|sidewalk):(left|right)$/.exec(key)
  if (noteMatch) {
    const group = groupFromPrefixSide(noteMatch[1]!, noteMatch[2]!)
    if (group) return group
  }

  const sideMatch = /^(?:source:)?(cycleway|sidewalk):(left|right)(?::|$)/.exec(key)
  if (sideMatch) {
    const group = groupFromPrefixSide(sideMatch[1]!, sideMatch[2]!)
    if (group) return group
  }

  return 'centerline'
}
