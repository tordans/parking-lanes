import along from '@turf/along'
import bearing from '@turf/bearing'
import destination from '@turf/destination'
import { featureCollection, lineString, point, polygon } from '@turf/helpers'
import length from '@turf/length'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import type { Feature, FeatureCollection, LineString, Point, Polygon, Position } from 'geojson'

export const HANDLE_ALONG_M = 10
export const SHORT_MAX_M = 30
export const LONG_MIN_M = 80
export const MIN_WIDTH_M = 1
/** Two handles closer than one handle length would overlap visually. */
export const HANDLE_OVERLAP_MIN_M = HANDLE_ALONG_M

export type HandleSide = 'left' | 'right'

export type HandleGeometry = {
  rectangles: FeatureCollection<Polygon>
  strokes: FeatureCollection<LineString>
  cues: FeatureCollection<Point>
  hitAreas: FeatureCollection<LineString>
}

export function handleCountForLength(lengthM: number): number {
  if (lengthM < SHORT_MAX_M) return 1
  if (lengthM <= LONG_MIN_M) return 2
  return 3
}

export function handleFractionsForLength(lengthM: number): number[] {
  const count = handleCountForLength(lengthM)
  if (count === 1) return [0.5]
  if (count === 2) return [0.15, 0.85]
  return [0.05, 0.5, 0.95]
}

/** Where along the line (0–1) the given position projects onto. */
export function fractionAlongLine(
  coordinates: Position[],
  lngLat: { lng: number; lat: number },
): number | null {
  if (coordinates.length < 2) return null

  const line = lineString(coordinates)
  const totalM = length(line, { units: 'meters' })
  if (totalM <= 0) return null

  const nearest = nearestPointOnLine(line, point([lngLat.lng, lngLat.lat]), { units: 'meters' })
  const locationM = nearest.properties.location
  if (locationM == null || !Number.isFinite(locationM)) return null

  return Math.min(1, Math.max(0, locationM / totalM))
}

/**
 * Insert a handle fraction, keeping the list sorted and dropping positions that would
 * overlap an existing handle.
 */
export function addHandleFractionUnlessOverlap(
  fractions: number[],
  next: number,
  totalM: number,
  minSeparationM = HANDLE_OVERLAP_MIN_M,
): number[] {
  const clamped = Math.min(0.98, Math.max(0.02, next))
  const minSeparation = totalM > 0 ? minSeparationM / totalM : 1
  if (fractions.some((fraction) => Math.abs(fraction - clamped) < minSeparation)) return fractions
  return [...fractions, clamped].sort((a, b) => a - b)
}

/** Project screen delta onto the outward normal for a handle side (map may be rotated). */
export function widthDeltaFromScreenDrag(args: {
  deltaX: number
  deltaY: number
  side: HandleSide
  alongBearing: number
  mapBearing: number
  metersPerPixel: number
}): number {
  const outwardBearing = args.side === 'right' ? args.alongBearing + 90 : args.alongBearing - 90
  const screenBearingDeg = outwardBearing - args.mapBearing
  const rad = (screenBearingDeg * Math.PI) / 180
  const ux = Math.sin(rad)
  const uy = -Math.cos(rad)
  const projectedPx = args.deltaX * ux + args.deltaY * uy
  // Symmetric about centerline: edge move of d metres → full width change 2d
  return 2 * projectedPx * args.metersPerPixel
}

function tangentBearingAt(line: Feature<LineString>, distanceM: number, totalM: number): number {
  const epsilon = Math.min(0.5, totalM / 4)
  const back = Math.max(0, distanceM - epsilon)
  const forward = Math.min(totalM, distanceM + epsilon)
  const from = along(line, back, { units: 'meters' })
  const to = along(line, forward, { units: 'meters' })
  return bearing(from, to)
}

function positionAtFraction(line: Feature<LineString>, fraction: number, totalM: number): Position {
  return along(line, fraction * totalM, { units: 'meters' }).geometry.coordinates
}

/** Offset a centerline perpendicular to its local bearing (used for sidepath handles). */
export function offsetPolylineCoordinates(
  coordinates: [number, number][],
  offsetM: number,
  side: 'left' | 'right',
): [number, number][] {
  if (coordinates.length < 2 || offsetM === 0) return coordinates

  const line = lineString(coordinates)
  const totalM = length(line, { units: 'meters' })
  if (totalM <= 0) return coordinates

  return coordinates.map((coord, index) => {
    const distanceM =
      index === coordinates.length - 1
        ? totalM
        : (index / Math.max(1, coordinates.length - 1)) * totalM
    const alongBearing = tangentBearingAt(line, distanceM, totalM)
    const offsetBearing = side === 'left' ? alongBearing - 90 : alongBearing + 90
    const offset = destination(point(coord), offsetM, offsetBearing, { units: 'meters' }).geometry
      .coordinates
    return [offset[0]!, offset[1]!] as [number, number]
  })
}

function buildHandleRectangle(
  center: Position,
  alongBearing: number,
  widthM: number,
): {
  polygon: Feature<Polygon>
  stroke: Feature<LineString>
  leftSide: Feature<LineString>
  rightSide: Feature<LineString>
  leftCue: Feature<Point>
  rightCue: Feature<Point>
} {
  const halfLen = HANDLE_ALONG_M / 2
  const halfWidth = widthM / 2
  const front = destination(point(center), halfLen, alongBearing, { units: 'meters' })
  const back = destination(point(center), halfLen, alongBearing - 180, { units: 'meters' })

  const frontLeft = destination(front, halfWidth, alongBearing - 90, { units: 'meters' })
  const frontRight = destination(front, halfWidth, alongBearing + 90, { units: 'meters' })
  const backRight = destination(back, halfWidth, alongBearing + 90, { units: 'meters' })
  const backLeft = destination(back, halfWidth, alongBearing - 90, { units: 'meters' })

  const ring = [
    frontLeft.geometry.coordinates,
    frontRight.geometry.coordinates,
    backRight.geometry.coordinates,
    backLeft.geometry.coordinates,
    frontLeft.geometry.coordinates,
  ]

  const leftMid = destination(
    point([
      (backLeft.geometry.coordinates[0]! + frontLeft.geometry.coordinates[0]!) / 2,
      (backLeft.geometry.coordinates[1]! + frontLeft.geometry.coordinates[1]!) / 2,
    ]),
    0,
    alongBearing,
    { units: 'meters' },
  )
  const rightMid = destination(
    point([
      (backRight.geometry.coordinates[0]! + frontRight.geometry.coordinates[0]!) / 2,
      (backRight.geometry.coordinates[1]! + frontRight.geometry.coordinates[1]!) / 2,
    ]),
    0,
    alongBearing,
    { units: 'meters' },
  )

  return {
    polygon: polygon([ring]),
    stroke: lineString(ring),
    leftSide: lineString([backLeft.geometry.coordinates, frontLeft.geometry.coordinates], {
      side: 'left',
      alongBearing,
    }),
    rightSide: lineString([backRight.geometry.coordinates, frontRight.geometry.coordinates], {
      side: 'right',
      alongBearing,
    }),
    leftCue: leftMid,
    rightCue: rightMid,
  }
}

export function buildHandleGeometry(
  coordinates: Position[],
  widthM: number,
  fractions?: number[],
): HandleGeometry | null {
  if (coordinates.length < 2 || widthM <= 0) return null

  const line = lineString(coordinates)
  const totalM = length(line, { units: 'meters' })
  if (totalM <= 0) return null

  const polygons: Feature<Polygon>[] = []
  const strokes: Feature<LineString>[] = []
  const cues: Feature<Point>[] = []
  const hitAreas: Feature<LineString>[] = []

  const placements =
    fractions && fractions.length > 0 ? fractions : handleFractionsForLength(totalM)

  for (const fraction of placements) {
    const center = positionAtFraction(line, fraction, totalM)
    const alongBearing = tangentBearingAt(line, fraction * totalM, totalM)
    const rect = buildHandleRectangle(center, alongBearing, widthM)

    polygons.push(rect.polygon)
    strokes.push(rect.stroke)
    cues.push(rect.leftCue, rect.rightCue)
    hitAreas.push(rect.leftSide, rect.rightSide)
  }

  return {
    rectangles: featureCollection(polygons),
    strokes: featureCollection(strokes),
    cues: featureCollection(cues),
    hitAreas: featureCollection(hitAreas),
  }
}
