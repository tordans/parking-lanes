import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { MapPage } from '../parking/map/MapPage'
import { getLocationFromCookie } from '../utils/location-cookie'

const mapSearchSchema = z.object({
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

  const initialView = {
    longitude: search.lng ?? cookieLocation?.location.lng ?? 24.609,
    latitude: search.lat ?? cookieLocation?.location.lat ?? 51.591,
    zoom: search.zoom ?? cookieLocation?.zoom ?? 5,
  }

  return <MapPage initialView={initialView} />
}
