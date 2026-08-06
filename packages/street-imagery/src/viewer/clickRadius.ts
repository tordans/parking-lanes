const EARTH_RADIUS_METERS = 6_371_000

/** Great-circle distance in meters between two WGS84 points. */
export const haversineDistanceMeters = (
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const lat1Rad = toRadians(lat1)
  const lat2Rad = toRadians(lat2)

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/** Click search radius in meters; ~50 m at z14, scales with zoom. */
export const clickRadiusMeters = (zoom: number): number => 50 * 2 ** (14 - zoom)
