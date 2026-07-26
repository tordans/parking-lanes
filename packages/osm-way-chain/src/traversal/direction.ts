import type { Segment } from '../domain/types'

const LEFT_RIGHT_RE = /:(left|right)(:|$)/

export function isReversedAtNode(current: Segment, neighbor: Segment, sharedNodeId: number) {
  const currentEnd = current.nodeIds[current.nodeIds.length - 1] === sharedNodeId ? 'end' : 'start'
  const neighborEnd =
    neighbor.nodeIds[neighbor.nodeIds.length - 1] === sharedNodeId ? 'end' : 'start'
  return currentEnd === neighborEnd
}

export function swapLeftRightKey(key: string) {
  return key.replace(LEFT_RIGHT_RE, (_match, side: string, suffix: string) => {
    const swapped = side === 'left' ? 'right' : 'left'
    return `:${swapped}${suffix}`
  })
}

export function normalizeTagsForDirection(tags: Segment['tags'], reversed: boolean) {
  if (!reversed) return tags

  const normalized: Segment['tags'] = {}
  for (const [key, value] of Object.entries(tags)) {
    if (LEFT_RIGHT_RE.test(key)) {
      normalized[swapLeftRightKey(key)] = value
    } else {
      normalized[key] = value
    }
  }
  return normalized
}

export function orientNeighbor(
  neighbor: Segment,
  sharedNodeId: number,
  fromSegment: Segment,
): Segment {
  const reversed = isReversedAtNode(fromSegment, neighbor, sharedNodeId)
  if (!reversed) return { ...neighbor, reversed: false }

  const reversedNodeIds = [...neighbor.nodeIds].reverse()
  const reversedCoords = [...neighbor.geometry.coordinates].reverse()

  return {
    ...neighbor,
    nodeIds: reversedNodeIds,
    geometry: {
      type: 'LineString',
      coordinates: reversedCoords,
    },
    tags: normalizeTagsForDirection(neighbor.tags, true),
    reversed: true,
  }
}
