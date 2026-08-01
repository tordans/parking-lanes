import type { OsmTags, OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'
import bearing from '@turf/bearing'
import { point } from '@turf/helpers'

export type DualCarriagewaySiblingMatch = {
  wayId: number
}

function isOneway(tags: OsmTags): boolean {
  const v = tags.oneway?.toLowerCase()
  return v === 'yes' || v === 'true' || v === '1'
}

function isDualOneway(tags: OsmTags | undefined): boolean {
  if (!tags) return false
  if (tags.dual_carriageway?.toLowerCase() !== 'yes') return false
  if (!tags.highway) return false
  return isOneway(tags)
}

function scoreNameRef(center: OsmTags, other: OsmTags): number {
  let score = 100
  if (center.name && other.name && center.name === other.name) score += 50
  if (center.ref && other.ref && center.ref === other.ref) score += 30
  if (center.highway && other.highway && center.highway === other.highway) score += 20
  return score
}

/** Absolute heading difference in [0, 180]. */
function headingDeltaDeg(a: number, b: number): number {
  let d = Math.abs(a - b) % 360
  if (d > 180) d = 360 - d
  return d
}

/**
 * Bearing leaving `sharedNodeId` along `way` (toward the rest of the way).
 * nodeCoords are [lat, lon].
 */
function departureBearingDeg(
  graph: ParsedOsmData,
  way: OsmWay,
  sharedNodeId: number,
): number | null {
  const nodes = way.nodes
  if (nodes.length < 2) return null
  let nextId: number | undefined
  if (nodes[0] === sharedNodeId) nextId = nodes[1]
  else if (nodes.at(-1) === sharedNodeId) nextId = nodes.at(-2)
  else return null

  const from = graph.nodeCoords[sharedNodeId]
  const to = nextId != null ? graph.nodeCoords[nextId] : undefined
  if (!from || !to) return null
  return bearing(point([from[1], from[0]]), point([to[1], to[0]]))
}

/**
 * The opposite branch of a dual carriageway split: another `dual_carriageway=yes`
 * oneway road-like way that shares an endpoint with `wayId`.
 *
 * Chain traversal picks one dual as prev/next; this finds the parallel sibling
 * so the diagram can show its real lanes instead of a mirrored placeholder.
 *
 * Prefers the candidate whose departure at the shared node is ~180° from this
 * way (opposite branch) over a collinear dual continuation (~0°).
 */
export function findDualCarriagewaySibling(
  graph: ParsedOsmData,
  wayId: number,
  options?: { excludeWayIds?: ReadonlySet<number> | readonly number[] },
): DualCarriagewaySiblingMatch | null {
  const way = graph.ways[wayId]
  if (!way || !isDualOneway(way.tags)) return null

  const exclude =
    options?.excludeWayIds instanceof Set
      ? options.excludeWayIds
      : new Set(options?.excludeWayIds ?? [])

  const endpoints = [way.nodes[0], way.nodes.at(-1)].filter((id): id is number => id != null)

  const waysAtNode = new Map<number, number[]>()
  for (const other of Object.values(graph.ways)) {
    for (const nodeId of other.nodes) {
      if (!endpoints.includes(nodeId)) continue
      const list = waysAtNode.get(nodeId)
      if (list) list.push(other.id)
      else waysAtNode.set(nodeId, [other.id])
    }
  }

  let best: { wayId: number; score: number } | null = null
  for (const nodeId of endpoints) {
    const fromBearing = departureBearingDeg(graph, way, nodeId)
    for (const otherId of waysAtNode.get(nodeId) ?? []) {
      if (otherId === wayId || exclude.has(otherId)) continue
      const other = graph.ways[otherId]
      if (!isDualOneway(other?.tags)) continue

      let score = scoreNameRef(way.tags, other!.tags)
      if (fromBearing != null) {
        const otherBearing = departureBearingDeg(graph, other!, nodeId)
        if (otherBearing != null) {
          // Prefer ~180° (opposite branch) over ~0° (same-carriageway continue).
          score += headingDeltaDeg(fromBearing, otherBearing)
        }
      }

      if (!best || score > best.score) best = { wayId: otherId, score }
    }
  }

  return best ? { wayId: best.wayId } : null
}
