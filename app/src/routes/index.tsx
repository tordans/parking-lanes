import { getLocationFromCookie } from '@osm-editor-kit/osm-map-url'
import { createFileRoute } from '@tanstack/react-router'
import { MapPage } from '../shell/map/MapPage'
import { mapSearchSchema } from '../shell/map/search-schema'

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
