import along from '@turf/along'
import bearing from '@turf/bearing'
import destination from '@turf/destination'
import { featureCollection, lineString, point } from '@turf/helpers'
import length from '@turf/length'
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'

export const CENTERLINE_DIRECTION_MARKER_SPACING_M = 20

function tangentBearingAt(line: Feature<LineString>, distanceM: number, totalM: number): number {
  const epsilon = Math.min(0.5, totalM / 4)
  const back = Math.max(0, distanceM - epsilon)
  const forward = Math.min(totalM, distanceM + epsilon)
  const from = along(line, back, { units: 'meters' })
  const to = along(line, forward, { units: 'meters' })
  return bearing(from, to)
}

function markerDistancesM(totalM: number, spacingM: number): number[] {
  const distances: number[] = []
  let distanceM = spacingM / 2
  while (distanceM < totalM) {
    distances.push(distanceM)
    distanceM += spacingM
  }
  if (distances.length === 0 && totalM > 0) distances.push(totalM / 2)
  return distances
}

/** Signed metres perpendicular to the way; matches sidepath `line-offset` paint. */
export function signedCenterlineOffsetMeters(properties: Record<string, unknown>): number {
  const side = properties.side === 'left' ? -1 : properties.side === 'right' ? 1 : 0
  if (side === 0) return 0

  if (typeof properties.offsetMeters === 'number') {
    return properties.offsetMeters * side
  }

  if (properties.kind === 'sidepath' && typeof properties.parentRoadWidthM === 'number') {
    return properties.parentRoadWidthM * 0.5 * side
  }

  return 0
}

function offsetPoint(
  coordinates: [number, number],
  alongBearing: number,
  offsetM: number,
): [number, number] {
  if (offsetM === 0) return coordinates

  const offsetBearing = offsetM > 0 ? alongBearing + 90 : alongBearing - 90
  const offset = destination(point(coordinates), Math.abs(offsetM), offsetBearing, {
    units: 'meters',
  }).geometry.coordinates
  return [offset[0]!, offset[1]!]
}

/** Point markers with `bearing` for a thin `>` along the selected centerline. */
export function buildCenterlineDirectionMarkers(
  collection: FeatureCollection,
  spacingM = CENTERLINE_DIRECTION_MARKER_SPACING_M,
): FeatureCollection<Point> {
  const markers: Feature<Point>[] = []

  for (const feature of collection.features) {
    if (feature.geometry?.type !== 'LineString') continue

    const coordinates = feature.geometry.coordinates
    if (coordinates.length < 2) continue

    const line = lineString(coordinates)
    const totalM = length(line, { units: 'meters' })
    if (totalM <= 0) continue

    const offsetM = signedCenterlineOffsetMeters(feature.properties ?? {})

    for (const distanceM of markerDistancesM(totalM, spacingM)) {
      const alongBearing = tangentBearingAt(line, distanceM, totalM)
      const at = along(line, distanceM, { units: 'meters' })
      const coordinatesAt = at.geometry.coordinates as [number, number]

      markers.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: offsetPoint(coordinatesAt, alongBearing, offsetM),
        },
        properties: {
          // `>` points east; rotate so it aligns with the way direction.
          bearing: alongBearing - 90,
        },
      })
    }
  }

  return featureCollection(markers)
}
