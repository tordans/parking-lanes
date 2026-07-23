import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { MapPage } from '../parking/map/MapPage'
import { getLocationFromCookie } from '../utils/location-cookie'
import { parseMapParam } from '../utils/map-param'

const mapSearchSchema = z.object({
  map: z.string().optional(),
  lng: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
  zoom: z.coerce.number().optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: mapSearchSchema,
  component: IndexPage,
})

function IndexPage() {
  const search = Route.useSearch()
  const cookieLocation = getLocationFromCookie()

  const mapFromParam = search.map ? parseMapParam(search.map) : null

  const initialView = {
    longitude: mapFromParam?.lng ?? search.lng ?? cookieLocation?.location.lng ?? 24.609,
    latitude: mapFromParam?.lat ?? search.lat ?? cookieLocation?.location.lat ?? 51.591,
    zoom: mapFromParam?.zoom ?? search.zoom ?? cookieLocation?.zoom ?? 5,
  }

  return <MapPage initialView={initialView} />
}
