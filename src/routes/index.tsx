import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { MapPage } from '../parking/map/MapPage'
import { getLocationFromCookie } from '../utils/location-cookie'
import { type MapParam, parseMapParam } from '../utils/map-param'

const mapParamSchema = z
  .union([
    z.string(),
    z.object({
      zoom: z.number(),
      lat: z.number(),
      lng: z.number(),
    }),
  ])
  .optional()
  .transform((value): MapParam | undefined => {
    if (value == null) return undefined
    if (typeof value === 'string') return parseMapParam(value) ?? undefined
    return value
  })

const mapSearchSchema = z.object({
  map: mapParamSchema,
})

export const Route = createFileRoute('/')({
  validateSearch: mapSearchSchema,
  component: IndexPage,
})

function IndexPage() {
  const search = Route.useSearch()
  const cookieLocation = getLocationFromCookie()

  const initialView = {
    longitude: search.map?.lng ?? cookieLocation?.location.lng ?? 24.609,
    latitude: search.map?.lat ?? cookieLocation?.location.lat ?? 51.591,
    zoom: search.map?.zoom ?? cookieLocation?.zoom ?? 5,
  }

  return <MapPage initialView={initialView} />
}
