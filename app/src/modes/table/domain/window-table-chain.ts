import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  getSharedNodeBetween,
  normalizeTagsForDirection,
  orientNeighbor,
  osmWayToSegment,
  type Segment,
  type SegmentChain,
} from '@osm-editor-kit/osm-way-chain'
import { findDualCarriagewaySibling } from '../../lanes/domain/find-dual-carriageway-sibling'

export const TABLE_CHAIN_MAX_PER_SIDE = 5

export type TableChainSegment = Segment & {
  /** Opposite dual-carriageway branch shown beside its pair (not a longitudinal neighbour). */
  dualSiblingOf?: number
}

export type TableDisplayChain = {
  segments: TableChainSegment[]
  centerIndex: number
}

/** Keep at most `maxPerSide` longitudinal neighbours on each side of the live centre. */
export function windowChainAroundCenter(
  segments: readonly Segment[],
  centerIndex: number,
  maxPerSide: number = TABLE_CHAIN_MAX_PER_SIDE,
): SegmentChain {
  if (centerIndex < 0 || centerIndex >= segments.length) {
    return { segments: [...segments], centerIndex }
  }
  const start = Math.max(0, centerIndex - maxPerSide)
  const end = Math.min(segments.length, centerIndex + maxPerSide + 1)
  return {
    segments: segments.slice(start, end),
    centerIndex: centerIndex - start,
  }
}

function orientSiblingBeside(anchor: Segment, sibling: Segment): Segment {
  const sharedNodeId = getSharedNodeBetween(anchor, sibling)
  if (sharedNodeId == null) {
    return {
      ...sibling,
      tags: normalizeTagsForDirection(sibling.tags, Boolean(sibling.reversed)),
    }
  }
  return orientNeighbor(sibling, sharedNodeId, anchor)
}

/**
 * After the ±N longitudinal window, insert opposite dual-carriageway branches
 * beside each segment that has one (does not consume the forward/back budget).
 */
export function insertDualCarriagewaySiblings(
  chain: SegmentChain,
  graph: ParsedOsmData,
): TableDisplayChain {
  const presentIds = new Set(chain.segments.map((segment) => segment.id))
  const segments: TableChainSegment[] = []
  let centerIndex = chain.centerIndex

  for (let i = 0; i < chain.segments.length; i++) {
    const segment = chain.segments[i]!
    if (i === chain.centerIndex) centerIndex = segments.length
    segments.push(segment)

    const match = findDualCarriagewaySibling(graph, segment.id, { excludeWayIds: presentIds })
    if (!match) continue
    const way = graph.ways[match.wayId]
    if (!way || presentIds.has(match.wayId)) continue

    const raw = osmWayToSegment(way, graph.nodeCoords)
    const oriented = orientSiblingBeside(segment, raw)
    segments.push({ ...oriented, dualSiblingOf: segment.id })
    presentIds.add(match.wayId)
  }

  return { segments, centerIndex }
}

/** Window ±maxPerSide around centre, then attach dual-carriageway siblings. */
export function buildTableDisplayChain(
  segments: readonly Segment[],
  centerIndex: number,
  graph: ParsedOsmData | undefined,
  maxPerSide: number = TABLE_CHAIN_MAX_PER_SIDE,
): TableDisplayChain {
  const windowed = windowChainAroundCenter(segments, centerIndex, maxPerSide)
  if (!graph) return { segments: [...windowed.segments], centerIndex: windowed.centerIndex }
  return insertDualCarriagewaySiblings(windowed, graph)
}
