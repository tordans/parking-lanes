import {
  getSharedNodeBetween,
  normalizeTagsForDirection,
  orientNeighbor,
  type Segment,
} from '@osm-editor-kit/osm-way-chain'

/**
 * Re-express a chain neighbour in the centre way's direction.
 * Required before parsing so reversed digitisation does not mirror left/right.
 */
export function orientNeighborForCenter(center: Segment, neighbor: Segment): Segment {
  const sharedNodeId = getSharedNodeBetween(center, neighbor)
  if (sharedNodeId == null) {
    return {
      ...neighbor,
      tags: normalizeTagsForDirection(neighbor.tags, Boolean(neighbor.reversed)),
    }
  }
  return orientNeighbor(neighbor, sharedNodeId, center)
}
