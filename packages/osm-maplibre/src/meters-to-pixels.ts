// From tilda-geo-cqi `docs/MapLibre-Line-Width-Offset-Units.md` (Germany φ=51°); adjust GERMANY_LAT / factor if targeting other regions.
//
// MapLibre only allows `["zoom"]` as the input to a *top-level* `interpolate` / `step`.
// Mercator metres→pixels is `meters * 2^zoom / PIXEL_SCALE`, expressed as exponential
// interpolate with base 2 and stops whose outputs are in ratio `2^(z1-z0)`.

export const EARTH_CIRCUMFERENCE = 40075016.686
export const TILE_SIZE = 512
export const GERMANY_LAT = 51

export const PIXEL_SCALE_GERMANY = pixelScaleFactorAtLat(GERMANY_LAT)

/** Zoom range covering normal editor use; outputs stay in exact 2^z ratio. */
const WIDTH_ZOOM_MIN = 0
const WIDTH_ZOOM_MAX = 22

export function pixelScaleFactorAtLat(latitudeDeg: number): number {
  return (EARTH_CIRCUMFERENCE * Math.cos((latitudeDeg * Math.PI) / 180)) / TILE_SIZE
}

export function metersPerPixel(zoom: number, latitudeDeg: number): number {
  return pixelScaleFactorAtLat(latitudeDeg) / 2 ** zoom
}

export function pixelsFromMeters(meters: number, zoom: number, latitudeDeg: number): number {
  return meters / metersPerPixel(zoom, latitudeDeg)
}

function scaleAtZoom(zoom: number, multiplier: number): number {
  return (multiplier * 2 ** zoom) / PIXEL_SCALE_GERMANY
}

/**
 * Line width in px from a numeric feature property in metres.
 * Optional `extraMeters` expands the line (e.g. hit targets) in ground units so zoom stays top-level.
 */
export function lineWidthFromMeters(
  property = 'roadWidthM',
  options?: { extraMeters?: number },
): readonly unknown[] {
  const extraMeters = options?.extraMeters ?? 0
  const widthExpr =
    extraMeters === 0
      ? (['get', property] as const)
      : (['+', ['get', property], extraMeters] as const)

  return [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    WIDTH_ZOOM_MIN,
    ['*', widthExpr, scaleAtZoom(WIDTH_ZOOM_MIN, 1)],
    WIDTH_ZOOM_MAX,
    ['*', widthExpr, scaleAtZoom(WIDTH_ZOOM_MAX, 1)],
  ]
}

/**
 * Line offset in px from a numeric feature property in metres.
 * Optional `sign` (e.g. left/right ±1) is multiplied inside stop outputs so `zoom`
 * stays the top-level interpolate input — do not wrap this expression in `*`.
 */
export function lineOffsetFromMeters(
  property = 'roadWidthM',
  fraction = 0.5,
  options?: { sign?: unknown },
): readonly unknown[] {
  const metersExpr =
    options?.sign === undefined
      ? (['get', property] as const)
      : (['*', ['get', property], options.sign] as const)

  return [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    WIDTH_ZOOM_MIN,
    ['*', metersExpr, scaleAtZoom(WIDTH_ZOOM_MIN, fraction)],
    WIDTH_ZOOM_MAX,
    ['*', metersExpr, scaleAtZoom(WIDTH_ZOOM_MAX, fraction)],
  ]
}
