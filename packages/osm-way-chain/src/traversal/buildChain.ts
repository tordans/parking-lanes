import type { JunctionChoice, NeighborDirection, Segment, SegmentChain } from '../domain/types'
import type { OsmDataAdapter } from '../ports/OsmDataAdapter'
import { orientNeighbor } from './direction'
import {
  type CandidateFilter,
  filterNeighborCandidates,
  getEndpointNodeId,
  getOtherEndpointNodeId,
  pickBestNeighbor,
} from './neighborMatch'

const DEFAULT_MAX_PER_SIDE = 5

export type BuildChainOptions = {
  centerWayId: number
  maxPerSide?: number
  /** Already loaded segments keyed by id */
  knownSegments?: Map<number, Segment>
  /** Optional predicate to restrict neighbor candidates (e.g. road-like highways) */
  candidateFilter?: CandidateFilter
}

export type BuildChainResult = {
  chain: SegmentChain
  pendingJunctions: JunctionChoice[]
}

async function loadSegment(adapter: OsmDataAdapter, id: number, cache: Map<number, Segment>) {
  const cached = cache.get(id)
  if (cached) return cached
  const segment = await adapter.getWay(id)
  cache.set(id, segment)
  return segment
}

async function extendChain(
  adapter: OsmDataAdapter,
  cache: Map<number, Segment>,
  start: Segment,
  direction: NeighborDirection,
  maxCount: number,
  candidateFilter?: CandidateFilter,
) {
  const extension: Segment[] = []
  const pendingJunctions: JunctionChoice[] = []
  let current = start

  for (let i = 0; i < maxCount; i++) {
    const endpoint = getEndpointNodeId(current, direction)
    const rawNeighbors = await adapter.getWaysForNode(endpoint)
    const candidates = filterNeighborCandidates(current, rawNeighbors, direction, candidateFilter)
    const best = pickBestNeighbor(current, candidates)

    if (!best) {
      if (candidates.length > 1) {
        pendingJunctions.push({ nodeId: endpoint, direction, candidates })
      }
      break
    }

    const fullBest = await loadSegment(adapter, best.id, cache)
    const oriented = orientNeighbor(fullBest, endpoint, current)
    extension.push(oriented)
    current = oriented
  }

  return { extension, pendingJunctions }
}

export async function buildChain(
  adapter: OsmDataAdapter,
  options: BuildChainOptions,
): Promise<BuildChainResult> {
  const cache = new Map(options.knownSegments ?? [])
  const maxPerSide = options.maxPerSide ?? DEFAULT_MAX_PER_SIDE
  const { candidateFilter } = options

  const center = await loadSegment(adapter, options.centerWayId, cache)

  const [backwardResult, forwardResult] = await Promise.all([
    extendChain(adapter, cache, center, 'backward', maxPerSide, candidateFilter),
    extendChain(adapter, cache, center, 'forward', maxPerSide, candidateFilter),
  ])

  const segments = [...backwardResult.extension.reverse(), center, ...forwardResult.extension]

  return {
    chain: {
      segments,
      centerIndex: backwardResult.extension.length,
    },
    pendingJunctions: [...backwardResult.pendingJunctions, ...forwardResult.pendingJunctions],
  }
}

export async function extendChainAtJunction(
  adapter: OsmDataAdapter,
  chain: SegmentChain,
  choice: JunctionChoice,
  selectedWayId: number,
  maxCount = DEFAULT_MAX_PER_SIDE,
  candidateFilter?: CandidateFilter,
): Promise<BuildChainResult> {
  const cache = new Map(chain.segments.map((s) => [s.id, s]))
  const selected = cache.get(selectedWayId) ?? (await adapter.getWay(selectedWayId))
  cache.set(selected.id, selected)

  const anchorIndex = choice.direction === 'forward' ? chain.segments.length - 1 : 0
  const anchor = chain.segments[anchorIndex]!
  const oriented = orientNeighbor(selected, choice.nodeId, anchor)

  const { extension, pendingJunctions } = await extendChain(
    adapter,
    cache,
    oriented,
    choice.direction,
    maxCount,
    candidateFilter,
  )

  let segments: Segment[]
  if (choice.direction === 'forward') {
    segments = [...chain.segments, oriented, ...extension]
  } else {
    segments = [...extension.reverse(), oriented, ...chain.segments]
  }

  return {
    chain: {
      segments,
      centerIndex: chain.centerIndex + (choice.direction === 'backward' ? extension.length + 1 : 0),
    },
    pendingJunctions,
  }
}

export function recenterChain(chain: SegmentChain, newCenterWayId: number): SegmentChain {
  const index = chain.segments.findIndex((s) => s.id === newCenterWayId)
  if (index === -1) return chain
  return { segments: chain.segments, centerIndex: index }
}

export function getSharedNodeBetween(a: Segment, b: Segment) {
  const aEnds = new Set([a.nodeIds[0], a.nodeIds[a.nodeIds.length - 1]])
  for (const nodeId of [b.nodeIds[0], b.nodeIds[b.nodeIds.length - 1]!]) {
    if (aEnds.has(nodeId)) return nodeId
  }
  return undefined
}

export { getOtherEndpointNodeId }
