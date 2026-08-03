import type { OsmTags, ParsedOsmData } from '@osm-editor-kit/osm-data'
import along from '@turf/along'
import bearing from '@turf/bearing'
import { lineString, point } from '@turf/helpers'
import length from '@turf/length'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import type { Feature, LineString, Position } from 'geojson'
import { wayLineCoordinates } from '../../parking/domain/way-side-order'

/** Perpendicular centreline distance must fall in this band (m). */
export const DUAL_SIBLING_MIN_DISTANCE_M = 2
export const DUAL_SIBLING_MAX_DISTANCE_M = 30

/** Candidate tangent must differ from centre tangent by ~180° ± this (deg). */
const ANTIPARALLEL_TOLERANCE_DEG = 30

/** Minimum overlapping projected extent along the centreline (m). */
const MIN_OVERLAP_M = 5

const SAMPLE_FRACTIONS = [0.25, 0.5, 0.75] as const

export type DualCarriagewaySiblingMatch = {
  wayId: number
  /** Perpendicular distance between centrelines (m), averaged over hits. */
  distanceM: number
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

function normalizeBearingDelta(deg: number): number {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return Math.abs(d)
}

function isAntiparallel(centerBearing: number, otherBearing: number): boolean {
  const delta = normalizeBearingDelta(otherBearing - centerBearing)
  return Math.abs(delta - 180) <= ANTIPARALLEL_TOLERANCE_DEG
}

function tangentBearingAt(line: Feature<LineString>, distanceM: number, totalM: number): number {
  const epsilon = Math.min(0.5, totalM / 4)
  const back = Math.max(0, distanceM - epsilon)
  const forward = Math.min(totalM, distanceM + epsilon)
  const from = along(line, back, { units: 'meters' })
  const to = along(line, forward, { units: 'meters' })
  return bearing(from, to)
}

function sampleFractions(totalM: number): number[] {
  if (totalM < 4) return [0.5]
  return [...SAMPLE_FRACTIONS]
}

function candidateLine(graph: ParsedOsmData, wayId: number): Feature<LineString> | null {
  const way = graph.ways[wayId]
  if (!way) return null
  const coordinates = wayLineCoordinates(way, graph.nodeCoords)
  if (coordinates.length < 2) return null
  return lineString(coordinates)
}

function distanceAlongLineM(line: Feature<LineString>, coord: Position): number | null {
  const nearest = nearestPointOnLine(line, point(coord), { units: 'meters' })
  const loc = nearest.properties.location
  if (loc == null || !Number.isFinite(loc)) return null
  return loc
}

function projectedExtentsM(
  centerLine: Feature<LineString>,
  otherLine: Feature<LineString>,
): { overlapM: number; centerLenM: number; otherLenM: number } {
  const centerLenM = length(centerLine, { units: 'meters' })
  const otherLenM = length(otherLine, { units: 'meters' })
  if (centerLenM <= 0 || otherLenM <= 0) {
    return { overlapM: 0, centerLenM, otherLenM }
  }

  let otherMin = Number.POSITIVE_INFINITY
  let otherMax = Number.NEGATIVE_INFINITY
  for (const coord of otherLine.geometry.coordinates) {
    const along = distanceAlongLineM(centerLine, coord)
    if (along == null) continue
    otherMin = Math.min(otherMin, along)
    otherMax = Math.max(otherMax, along)
  }

  if (!Number.isFinite(otherMin) || !Number.isFinite(otherMax)) {
    return { overlapM: 0, centerLenM, otherLenM }
  }

  const overlapM = Math.min(centerLenM, otherMax) - Math.max(0, otherMin)
  return { overlapM, centerLenM, otherLenM }
}

function hasNontrivialOverlap(
  centerLine: Feature<LineString>,
  otherLine: Feature<LineString>,
): boolean {
  const { overlapM, centerLenM, otherLenM } = projectedExtentsM(centerLine, otherLine)
  const minSpan = Math.min(centerLenM, otherLenM)
  const threshold = Math.min(MIN_OVERLAP_M, minSpan * 0.25)
  return overlapM >= threshold
}

function preferenceScore(centerTags: OsmTags, otherTags: OsmTags): number {
  let score = 0
  if (isDualOneway(otherTags)) score += 100
  if (centerTags.name && otherTags.name && centerTags.name === otherTags.name) score += 50
  if (centerTags.ref && otherTags.ref && centerTags.ref === otherTags.ref) score += 30
  if (centerTags.highway && otherTags.highway && centerTags.highway === otherTags.highway)
    score += 20
  return score
}

function isCandidate(centerTags: OsmTags, otherTags: OsmTags | undefined): boolean {
  if (!otherTags || !isOneway(otherTags) || !otherTags.highway) return false
  if (isDualOneway(otherTags)) return true
  return Boolean(centerTags.name && otherTags.name && centerTags.name === otherTags.name)
}

/**
 * Opposite branch of a dual carriageway: antiparallel oneway road-like way within
 * ~2–30 m perpendicular distance and with overlapping projected extent along the
 * selected centreline (rejects collinear end-to-end tip links).
 */
export function findDualCarriagewaySibling(
  graph: ParsedOsmData,
  wayId: number,
): DualCarriagewaySiblingMatch | null {
  const way = graph.ways[wayId]
  if (!way || !isDualOneway(way.tags)) return null

  const centerLine = candidateLine(graph, wayId)
  if (!centerLine) return null

  const centerLenM = length(centerLine, { units: 'meters' })
  if (centerLenM <= 0) return null

  const samples: Array<{ position: Position; alongBearing: number }> = []
  for (const fraction of sampleFractions(centerLenM)) {
    const distanceM = fraction * centerLenM
    const position = along(centerLine, distanceM, { units: 'meters' }).geometry.coordinates
    const alongBearing = tangentBearingAt(centerLine, distanceM, centerLenM)
    samples.push({ position, alongBearing })
  }

  let best:
    | (DualCarriagewaySiblingMatch & { preference: number; antiparallelScore: number })
    | null = null

  for (const [idStr, otherWay] of Object.entries(graph.ways)) {
    const otherId = Number(idStr)
    if (otherId === wayId) continue
    if (!isCandidate(way.tags, otherWay.tags)) continue

    const otherLine = candidateLine(graph, otherId)
    if (!otherLine) continue
    if (!hasNontrivialOverlap(centerLine, otherLine)) continue

    const otherLenM = length(otherLine, { units: 'meters' })
    if (otherLenM <= 0) continue

    let hitCount = 0
    let distanceSum = 0
    let antiparallelScore = 0

    for (const sample of samples) {
      const nearest = nearestPointOnLine(otherLine, point(sample.position), { units: 'meters' })
      const distanceM = nearest.properties.dist
      if (
        distanceM == null ||
        !Number.isFinite(distanceM) ||
        distanceM < DUAL_SIBLING_MIN_DISTANCE_M ||
        distanceM > DUAL_SIBLING_MAX_DISTANCE_M
      ) {
        continue
      }

      const nearestAlong = nearest.properties.location
      if (
        nearestAlong == null ||
        !Number.isFinite(nearestAlong) ||
        nearestAlong < 0.5 ||
        nearestAlong > otherLenM - 0.5
      ) {
        continue
      }

      const otherBearing = tangentBearingAt(otherLine, nearestAlong, otherLenM)
      if (!isAntiparallel(sample.alongBearing, otherBearing)) continue

      hitCount++
      distanceSum += distanceM
      antiparallelScore += Math.abs(normalizeBearingDelta(otherBearing - sample.alongBearing) - 180)
    }

    if (hitCount === 0) continue

    const distanceM = distanceSum / hitCount
    const preference = preferenceScore(way.tags, otherWay.tags)

    if (
      best == null ||
      preference > best.preference ||
      (preference === best.preference && antiparallelScore < best.antiparallelScore) ||
      (preference === best.preference &&
        antiparallelScore === best.antiparallelScore &&
        distanceM < best.distanceM)
    ) {
      best = { wayId: otherId, distanceM, preference, antiparallelScore }
    }
  }

  if (!best) return null
  return { wayId: best.wayId, distanceM: best.distanceM }
}
