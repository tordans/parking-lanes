import type { OsmWay } from '@osm-editor-kit/osm-data'
import bearing from '@turf/bearing'
import { lineString, point } from '@turf/helpers'
import length from '@turf/length'
import type { Side } from '../../../utils/types/parking'

const MIN_SEGMENT_LENGTH_SHARE = 0.15
const SCREEN_AXIS_EPSILON = 0.05

function normalizeBearing(degrees: number): number {
  const normalized = degrees % 360
  return normalized < 0 ? normalized + 360 : normalized
}

/**
 * Length-weighted bearing of the longest straight runs, ignoring short segments
 * from tight curves or node jitter.
 */
export function dominantWayBearing(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0

  const segments: { lengthM: number; bearingDeg: number }[] = []
  for (let i = 0; i < coordinates.length - 1; i++) {
    const from = point(coordinates[i])
    const to = point(coordinates[i + 1])
    const lengthM = length(lineString([coordinates[i]!, coordinates[i + 1]!]), {
      units: 'meters',
    })
    if (lengthM < 0.01) continue
    segments.push({ lengthM, bearingDeg: bearing(from, to) })
  }

  if (segments.length === 0) return 0

  const maxLength = Math.max(...segments.map((segment) => segment.lengthM))
  const minLength = maxLength * MIN_SEGMENT_LENGTH_SHARE

  let sumSin = 0
  let sumCos = 0
  let totalWeight = 0

  for (const segment of segments) {
    if (segment.lengthM < minLength) continue
    const rad = (segment.bearingDeg * Math.PI) / 180
    sumSin += Math.sin(rad) * segment.lengthM
    sumCos += Math.cos(rad) * segment.lengthM
    totalWeight += segment.lengthM
  }

  if (totalWeight < 0.01) {
    return normalizeBearing(segments[0]!.bearingDeg)
  }

  return normalizeBearing((Math.atan2(sumSin, sumCos) * 180) / Math.PI)
}

function outwardScreenPosition(
  alongBearing: number,
  side: Side,
  mapBearing: number,
): { x: number; y: number } {
  const outwardBearing = side === 'right' ? alongBearing + 90 : alongBearing - 90
  const screenBearingDeg = outwardBearing - mapBearing
  const rad = (screenBearingDeg * Math.PI) / 180
  return { x: Math.sin(rad), y: -Math.cos(rad) }
}

/** Order OSM left/right panels to match screen left → right along the dominant way bearing. */
export function screenOrderedParkingSides(
  coordinates: [number, number][],
  mapBearing = 0,
): [Side, Side] {
  const alongBearing = dominantWayBearing(coordinates)
  const leftScreen = outwardScreenPosition(alongBearing, 'left', mapBearing)
  const rightScreen = outwardScreenPosition(alongBearing, 'right', mapBearing)
  const deltaX = leftScreen.x - rightScreen.x

  if (Math.abs(deltaX) > SCREEN_AXIS_EPSILON) {
    return leftScreen.x < rightScreen.x ? ['left', 'right'] : ['right', 'left']
  }

  return leftScreen.y < rightScreen.y ? ['left', 'right'] : ['right', 'left']
}

export function wayLineCoordinates(
  way: OsmWay,
  nodeCoords: Record<number, [number, number]>,
): [number, number][] {
  return way.nodes
    .map((nodeId) => {
      const coord = nodeCoords[nodeId]
      if (!coord) return null
      return [coord[1]!, coord[0]!] as [number, number]
    })
    .filter((coord): coord is [number, number] => coord != null)
}
