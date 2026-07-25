// From tilda-geo-cqi `docs/MapLibre-Line-Width-Offset-Units.md` (Germany φ=51°); adjust GERMANY_LAT / factor if targeting other regions.

export const EARTH_CIRCUMFERENCE = 40075016.686
export const TILE_SIZE = 512
export const GERMANY_LAT = 51

export const PIXEL_SCALE_GERMANY = pixelScaleFactorAtLat(GERMANY_LAT)

export function pixelScaleFactorAtLat(latitudeDeg: number): number {
  return (EARTH_CIRCUMFERENCE * Math.cos((latitudeDeg * Math.PI) / 180)) / TILE_SIZE
}

export function metersPerPixel(zoom: number, latitudeDeg: number): number {
  return pixelScaleFactorAtLat(latitudeDeg) / 2 ** zoom
}

export function pixelsFromMeters(meters: number, zoom: number, latitudeDeg: number): number {
  return meters / metersPerPixel(zoom, latitudeDeg)
}

export function lineWidthFromMeters(property = 'roadWidthM'): readonly unknown[] {
  return ['*', ['get', property], ['/', ['^', 2, ['zoom']], PIXEL_SCALE_GERMANY]]
}

export function lineOffsetFromMeters(property = 'roadWidthM', fraction = 0.5): readonly unknown[] {
  return ['*', ['*', ['get', property], fraction], ['/', ['^', 2, ['zoom']], PIXEL_SCALE_GERMANY]]
}

/** Fixed pixel ramp for selected centerline chrome (from tilda-geo-cqi radinfra_cqi). */
export const selectedCenterlineWidth: readonly unknown[] = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13,
  2,
  16,
  4,
  18,
  6,
]
