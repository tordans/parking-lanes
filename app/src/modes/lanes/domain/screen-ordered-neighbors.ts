import bearing from '@turf/bearing'
import { point } from '@turf/helpers'
import type { Position } from 'geojson'

const SCREEN_AXIS_EPSILON = 0.05

function midpoint(coordinates: Position[]): [number, number] | null {
  if (coordinates.length === 0) return null
  const mid = coordinates[Math.floor((coordinates.length - 1) / 2)]
  if (!mid || mid.length < 2) return null
  return [mid[0]!, mid[1]!]
}

/** Screen unit vector (x right, y up) for a geographic bearing. */
function bearingToScreen(alongBearing: number, mapBearing: number): { x: number; y: number } {
  const screenBearingDeg = alongBearing - mapBearing
  const rad = (screenBearingDeg * Math.PI) / 180
  return { x: Math.sin(rad), y: -Math.cos(rad) }
}

/**
 * Order chain neighbors for left → right columns so the left box is bottom-ish
 * on the map and the right box is top-ish (same screen projection as parking sides).
 */
export function screenOrderedChainNeighbors<T extends { geometry: { coordinates: Position[] } }>(
  prev: T | null | undefined,
  next: T | null | undefined,
  center: T | null | undefined,
  mapBearing = 0,
): { left: T | null; right: T | null; swapped: boolean } {
  if (!prev && !next) return { left: null, right: null, swapped: false }
  if (!prev) return { left: null, right: next ?? null, swapped: false }
  if (!next) return { left: prev, right: null, swapped: false }
  if (!center) return { left: prev, right: next, swapped: false }

  const centerMid = midpoint(center.geometry.coordinates)
  const prevMid = midpoint(prev.geometry.coordinates)
  const nextMid = midpoint(next.geometry.coordinates)
  if (!centerMid || !prevMid || !nextMid) {
    return { left: prev, right: next, swapped: false }
  }

  const prevScreen = bearingToScreen(bearing(point(centerMid), point(prevMid)), mapBearing)
  const nextScreen = bearingToScreen(bearing(point(centerMid), point(nextMid)), mapBearing)
  const deltaY = prevScreen.y - nextScreen.y

  // Prefer vertical: larger y = bottom of map (see parking screen projection) → left column.
  if (Math.abs(deltaY) > SCREEN_AXIS_EPSILON) {
    const swapped = prevScreen.y < nextScreen.y
    return swapped
      ? { left: next, right: prev, swapped: true }
      : { left: prev, right: next, swapped: false }
  }

  // Horizontal fallback: smaller x = left of map → left column.
  const swapped = prevScreen.x > nextScreen.x
  return swapped
    ? { left: next, right: prev, swapped: true }
    : { left: prev, right: next, swapped: false }
}
