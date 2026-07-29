import type { ParsedOsmData, OsmTags } from '@osm-editor-kit/osm-data'
import type { SeparatelyMappedSidepath } from '@osm-editor-kit/osm-lane-diagram'
import along from '@turf/along'
import bearing from '@turf/bearing'
import { lineString, point } from '@turf/helpers'
import length from '@turf/length'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import type { Feature, LineString, Position } from 'geojson'
import { wayLineCoordinates } from '../../parking/domain/way-side-order'

export const SEPARATELY_MAPPED_SIDEPATH_MAX_DISTANCE_M = 20

/** Max angular deviation from the OSM-side perpendicular for a hit to count. */
const MAX_BEARING_DELTA_DEG = 60

const SAMPLE_FRACTIONS = [0.25, 0.5, 0.75] as const

export type SeparatelyMappedSidepathMatch = {
  wayId: number
  distanceM: number
}

function isCrossing(tags: OsmTags): boolean {
  return (
    tags.footway === 'crossing' ||
    tags.cycleway === 'crossing' ||
    tags.path === 'crossing' ||
    tags.crossing != null
  )
}

function isBicycleAccess(tags: OsmTags): boolean {
  const value = tags.bicycle
  return value === 'yes' || value === 'designated'
}

/** Whether a way is a plausible separately mapped sidepath for the given prefix. */
export function isSeparatelyMappedSidepathCandidate(
  tags: OsmTags | undefined,
  prefix: SeparatelyMappedSidepath['prefix'],
): boolean {
  if (!tags) return false
  const highway = tags.highway
  if (!highway || isCrossing(tags)) return false

  if (prefix === 'sidewalk') {
    return highway === 'footway' || highway === 'path' || highway === 'pedestrian'
  }

  if (highway === 'cycleway') return true
  if ((highway === 'path' || highway === 'footway') && isBicycleAccess(tags)) return true
  return false
}

function preferenceScore(
  tags: OsmTags | undefined,
  prefix: SeparatelyMappedSidepath['prefix'],
): number {
  if (!tags) return 0
  if (prefix === 'sidewalk' && tags.footway === 'sidewalk') return 2
  if (prefix === 'cycleway' && tags.highway === 'cycleway') return 2
  return 1
}

function normalizeBearingDelta(deg: number): number {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return Math.abs(d)
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

/**
 * Find the nearest separately mapped sidewalk/cycleway within `maxDistanceM` on the
 * given OSM side of `centerWayId`, looking roughly orthogonal to the centreline.
 */
export function findSeparatelyMappedSidepath(
  graph: ParsedOsmData,
  centerWayId: number,
  hint: SeparatelyMappedSidepath,
  options?: { maxDistanceM?: number },
): SeparatelyMappedSidepathMatch | null {
  const maxDistanceM = options?.maxDistanceM ?? SEPARATELY_MAPPED_SIDEPATH_MAX_DISTANCE_M
  const centerLine = candidateLine(graph, centerWayId)
  if (!centerLine) return null

  const totalM = length(centerLine, { units: 'meters' })
  if (totalM <= 0) return null

  const samples: Array<{ position: Position; perpendicularBearing: number }> = []
  for (const fraction of sampleFractions(totalM)) {
    const distanceM = fraction * totalM
    const position = along(centerLine, distanceM, { units: 'meters' }).geometry.coordinates
    const alongBearing = tangentBearingAt(centerLine, distanceM, totalM)
    const perpendicularBearing = hint.side === 'left' ? alongBearing - 90 : alongBearing + 90
    samples.push({ position, perpendicularBearing })
  }

  let best: (SeparatelyMappedSidepathMatch & { preference: number }) | null = null

  for (const [idStr, way] of Object.entries(graph.ways)) {
    const wayId = Number(idStr)
    if (wayId === centerWayId) continue
    if (!isSeparatelyMappedSidepathCandidate(way.tags, hint.prefix)) continue

    const otherLine = candidateLine(graph, wayId)
    if (!otherLine) continue

    let minDistanceM = Number.POSITIVE_INFINITY
    for (const sample of samples) {
      const nearest = nearestPointOnLine(otherLine, point(sample.position), { units: 'meters' })
      const distanceM = nearest.properties.dist
      if (distanceM == null || !Number.isFinite(distanceM) || distanceM > maxDistanceM) continue

      const toNearest = bearing(point(sample.position), nearest)
      if (normalizeBearingDelta(toNearest - sample.perpendicularBearing) > MAX_BEARING_DELTA_DEG) {
        continue
      }

      minDistanceM = Math.min(minDistanceM, distanceM)
    }

    if (!Number.isFinite(minDistanceM)) continue

    const preference = preferenceScore(way.tags, hint.prefix)
    if (
      best == null ||
      minDistanceM < best.distanceM - 0.01 ||
      (Math.abs(minDistanceM - best.distanceM) <= 0.01 && preference > best.preference)
    ) {
      best = { wayId, distanceM: minDistanceM, preference }
    }
  }

  if (!best) return null
  return { wayId: best.wayId, distanceM: best.distanceM }
}
