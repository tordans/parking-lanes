import { z } from 'zod'

export type MapParam = {
  zoom: number
  lat: number
  lng: number
}

const range = (min: number, max: number) => z.coerce.number().gte(min).lte(max)

const MapParamSchema = z.tuple([range(0, 22), range(-90, 90), range(-180, 180)])

const roundNumber = (number: number | string, precision?: number) => {
  if (typeof number === 'string') {
    return Number.parseFloat(Number.parseFloat(number).toFixed(precision))
  }
  return Number.parseFloat(number.toFixed(precision))
}

const roundByZoom = (number: number | string, zoom: number) => {
  const latLngPrecisionByZoom = zoom >= 17 ? 5 : zoom < 13 ? 3 : 4
  return roundNumber(number, latLngPrecisionByZoom)
}

export const roundPositionForURL = (lat: number, lng: number, zoom: number) => {
  lat = roundByZoom(lat, zoom)
  lng = roundByZoom(lng, zoom)
  zoom = roundNumber(zoom, 1)
  return [lat, lng, zoom] as const
}

export const parseMapParam = (query: string) => {
  const parsed = MapParamSchema.safeParse(query.split('/'))
  if (!parsed.success) return null
  const [zoom, lat, lng] = parsed.data
  return { zoom, lat, lng } satisfies MapParam
}

/** Legacy bookmark shape: `#map=zoom/lat/lng` (redirected to `?map=` on load). */
export const parseLegacyMapHash = (hash: string) => {
  const query = hash.startsWith('#') ? hash.slice(1) : hash
  if (!query.startsWith('map=')) return null
  return parseMapParam(query.slice('map='.length))
}

export const serializeMapParam = ({ zoom, lat, lng }: MapParam) => {
  const [roundedLat, roundedLng, roundedZoom] = roundPositionForURL(lat, lng, zoom)
  return `${roundedZoom}/${roundedLat}/${roundedLng}`
}
