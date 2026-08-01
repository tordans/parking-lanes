import type { TagRow } from './tag-diff'

export type PropagateSuggestion = {
  key: string
  value: string
  affectedWayIds: number[]
  description: string
}

type SegmentLike = {
  id: number
  tags: Record<string, string>
}

/** Suggest propagating center segment value to segments with different/missing values. */
export function suggestPropagateFromCenter(
  segments: SegmentLike[],
  centerIndex: number,
  rows: TagRow[],
): PropagateSuggestion[] {
  const center = segments[centerIndex]
  if (!center) return []

  const suggestions: PropagateSuggestion[] = []

  for (const row of rows) {
    const centerCell = row.cells[centerIndex]
    if (!centerCell?.value) continue

    const affected: number[] = []
    for (let i = 0; i < row.cells.length; i++) {
      if (i === centerIndex) continue
      const cell = row.cells[i]
      if (cell && cell.value !== centerCell.value) {
        affected.push(cell.segmentId)
      }
    }

    if (affected.length > 0) {
      suggestions.push({
        key: row.key,
        value: centerCell.value,
        affectedWayIds: affected,
        description: `Set "${row.key}" to "${centerCell.value}" on ${affected.length} segment(s)`,
      })
    }
  }

  return suggestions
}
