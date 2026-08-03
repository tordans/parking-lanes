import type { OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  getSharedNodeBetween,
  normalizeTagsForDirection,
  orientNeighbor,
  osmWayToSegment,
  type Segment,
  type SegmentChain,
} from '@osm-editor-kit/osm-way-chain'
import { getPendingWay } from '../../../utils/changes-store'
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

function loadRawSegment(graph: ParsedOsmData, wayId: number): Segment | null {
  const way: OsmWay | undefined = getPendingWay(wayId) ?? graph.ways[wayId]
  if (!way) return null
  return osmWayToSegment(way, graph.nodeCoords)
}

/**
 * Rebuild left/right orientation for the windowed chain order around the live centre.
 *
 * Needed because walking updates the centre before async `buildChain` finishes — stored
 * neighbour tags may still be oriented to the previous centre.
 */
export function reorientChainAroundCenter(
  orderedWayIds: readonly number[],
  centerIndex: number,
  graph: ParsedOsmData,
): SegmentChain {
  if (orderedWayIds.length === 0 || centerIndex < 0 || centerIndex >= orderedWayIds.length) {
    return { segments: [], centerIndex: 0 }
  }

  const centerRaw = loadRawSegment(graph, orderedWayIds[centerIndex]!)
  if (!centerRaw) return { segments: [], centerIndex: 0 }

  const segments: Segment[] = Array.from({ length: orderedWayIds.length })
  segments[centerIndex] = { ...centerRaw, reversed: false }

  let current = segments[centerIndex]!
  for (let i = centerIndex + 1; i < orderedWayIds.length; i++) {
    const raw = loadRawSegment(graph, orderedWayIds[i]!)
    if (!raw) break
    const shared = getSharedNodeBetween(current, raw)
    segments[i] =
      shared == null ? { ...raw, reversed: false } : orientNeighbor(raw, shared, current)
    current = segments[i]!
  }

  current = segments[centerIndex]!
  for (let i = centerIndex - 1; i >= 0; i--) {
    const raw = loadRawSegment(graph, orderedWayIds[i]!)
    if (!raw) break
    const shared = getSharedNodeBetween(current, raw)
    segments[i] =
      shared == null ? { ...raw, reversed: false } : orientNeighbor(raw, shared, current)
    current = segments[i]!
  }

  // Drop any holes if a way disappeared mid-walk (should be rare).
  const compact: Segment[] = []
  let newCenter = 0
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (!segment) continue
    if (i === centerIndex) newCenter = compact.length
    compact.push(segment)
  }

  return { segments: compact, centerIndex: newCenter }
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

    const match = findDualCarriagewaySibling(graph, segment.id)
    if (!match) continue
    const raw = loadRawSegment(graph, match.wayId)
    if (!raw || presentIds.has(match.wayId)) continue

    const oriented = orientSiblingBeside(segment, raw)
    segments.push({ ...oriented, dualSiblingOf: segment.id })
    presentIds.add(match.wayId)
  }

  return { segments, centerIndex }
}

/** Window ±maxPerSide, reorient left/right to the live centre, then attach dual siblings. */
export function buildTableDisplayChain(
  segments: readonly Segment[],
  centerIndex: number,
  graph: ParsedOsmData | undefined,
  maxPerSide: number = TABLE_CHAIN_MAX_PER_SIDE,
): TableDisplayChain {
  const windowed = windowChainAroundCenter(segments, centerIndex, maxPerSide)
  if (!graph) return { segments: [...windowed.segments], centerIndex: windowed.centerIndex }

  const reoriented = reorientChainAroundCenter(
    windowed.segments.map((segment) => segment.id),
    windowed.centerIndex,
    graph,
  )
  if (reoriented.segments.length === 0) {
    return { segments: [...windowed.segments], centerIndex: windowed.centerIndex }
  }
  return insertDualCarriagewaySiblings(reoriented, graph)
}
