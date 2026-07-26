import type { NeighborDirection, Segment } from '../domain/types'

/** Primary highway-like key used for same-kind matching */
const KIND_KEYS = ['highway', 'cycleway', 'footway', 'path', 'railway', 'waterway'] as const

export type CandidateFilter = (segment: Segment) => boolean

export function getKindKey(tags: Segment['tags']) {
  for (const key of KIND_KEYS) {
    if (tags[key]) return { key, value: tags[key] }
  }
  return undefined
}

export function sameKind(a: Segment, b: Segment) {
  const kindA = getKindKey(a.tags)
  const kindB = getKindKey(b.tags)
  if (!kindA || !kindB) return false
  return kindA.key === kindB.key && kindA.value === kindB.value
}

export function getEndpointNodeId(segment: Segment, direction: NeighborDirection) {
  const { nodeIds } = segment
  return direction === 'forward' ? nodeIds[nodeIds.length - 1]! : nodeIds[0]!
}

export function getOtherEndpointNodeId(segment: Segment, sharedNodeId: number) {
  const first = segment.nodeIds[0]
  const last = segment.nodeIds[segment.nodeIds.length - 1]
  if (first === sharedNodeId) return last!
  if (last === sharedNodeId) return first!
  return undefined
}

/** Filter candidates at a junction: exclude self, prefer same kind */
export function filterNeighborCandidates(
  from: Segment,
  candidates: Segment[],
  direction: NeighborDirection,
  candidateFilter?: CandidateFilter,
) {
  const endpoint = getEndpointNodeId(from, direction)
  const touching = candidates.filter((c) => {
    if (c.id === from.id) return false
    if (candidateFilter && !candidateFilter(c)) return false
    const first = c.nodeIds[0]
    const last = c.nodeIds[c.nodeIds.length - 1]
    return first === endpoint || last === endpoint
  })

  const sameKindMatches = touching.filter((c) => sameKind(from, c))
  if (sameKindMatches.length > 0) return sameKindMatches
  return touching
}

/** Score candidate for auto-follow (higher = better) */
export function scoreNeighborCandidate(from: Segment, candidate: Segment) {
  let score = 0
  if (sameKind(from, candidate)) score += 100
  if (candidate.tags.name && candidate.tags.name === from.tags.name) score += 50
  if (candidate.tags.ref && candidate.tags.ref === from.tags.ref) score += 30
  return score
}

export function pickBestNeighbor(from: Segment, candidates: Segment[]) {
  if (candidates.length === 0) return undefined
  if (candidates.length === 1) return candidates[0]

  const scored = candidates
    .map((c) => ({ segment: c, score: scoreNeighborCandidate(from, c) }))
    .sort((a, b) => b.score - a.score)

  const top = scored[0]!
  const second = scored[1]!
  if (top.score === second.score && top.score < 100) return undefined
  return top.segment
}
