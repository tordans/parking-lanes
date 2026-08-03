import { classifyTagKey, TABLE_TAG_GROUP_ORDER, type TableTagGroupId } from './tag-groups'

export type TagDiffStatus = 'unchanged' | 'changed' | 'added' | 'removed' | 'missing'

export type TagDiffCell = {
  key: string
  segmentId: number
  value: string | undefined
  status: TagDiffStatus
}

export type TagRow = {
  key: string
  cells: TagDiffCell[]
}

export type TagGroupSection = {
  id: TableTagGroupId
  rows: TagRow[]
}

type SegmentLike = {
  id: number
  tags: Record<string, string>
}

type ChainLike = {
  segments: SegmentLike[]
  centerIndex: number
}

function classifyCell(
  centerValue: string | undefined,
  value: string | undefined,
  isCenter: boolean,
): TagDiffStatus {
  if (isCenter) {
    return value === undefined ? 'missing' : 'unchanged'
  }
  if (centerValue === undefined && value !== undefined) return 'added'
  if (centerValue !== undefined && value === undefined) return 'removed'
  if (centerValue === value) return 'unchanged'
  return 'changed'
}

/** Build sorted tag rows with per-segment diff status vs center. */
export function buildTagRows(chain: ChainLike): TagRow[] {
  const { segments, centerIndex } = chain
  const center = segments[centerIndex]
  if (!center) return []

  const allKeys = new Set<string>()
  for (const segment of segments) {
    for (const key of Object.keys(segment.tags)) allKeys.add(key)
  }

  const sortedKeys = [...allKeys].sort((a, b) => a.localeCompare(b))

  return sortedKeys.map((key) => {
    const centerValue = center.tags[key]
    const cells: TagDiffCell[] = segments.map((segment, index) => {
      const value = segment.tags[key]
      return {
        key,
        segmentId: segment.id,
        value,
        status: classifyCell(centerValue, value, index === centerIndex),
      }
    })
    return { key, cells }
  })
}

/** Partition tag rows into centerline / bikelane / sidewalk disclosure groups. */
export function buildTagGroups(chain: ChainLike): TagGroupSection[] {
  const rows = buildTagRows(chain)
  const buckets = new Map<TableTagGroupId, TagRow[]>()
  for (const id of TABLE_TAG_GROUP_ORDER) buckets.set(id, [])

  for (const row of rows) {
    const groupId = classifyTagKey(row.key)
    buckets.get(groupId)!.push(row)
  }

  return TABLE_TAG_GROUP_ORDER.map((id) => ({
    id,
    rows: buckets.get(id) ?? [],
  })).filter((section) => section.rows.length > 0)
}

export function getDiffStatusClass(status: TagDiffStatus): string {
  switch (status) {
    case 'unchanged':
      return 'bg-white'
    case 'changed':
      return 'bg-amber-100'
    case 'added':
      return 'bg-green-100'
    case 'removed':
      return 'bg-red-100'
    case 'missing':
      return 'bg-zinc-50 text-zinc-400'
  }
}
