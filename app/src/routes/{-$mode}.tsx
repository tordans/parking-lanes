import { getLocationFromCookie } from '@osm-editor-kit/osm-map-url'
import { createFileRoute } from '@tanstack/react-router'
import type { StreetSpaceModeId } from '../modes/types'
import { MapPage } from '../shell/map/MapPage'
import { isStreetSpaceModeId } from '../shell/map/mode-params'
import { mapSearchSchema } from '../shell/map/search-schema'

/** Optional mode slug: `/` = parking, `/width` = width. Same route → map stays mounted. */
export const Route = createFileRoute('/{-$mode}')({
  params: {
    parse: (raw): { mode: StreetSpaceModeId } => ({
      mode: raw.mode && isStreetSpaceModeId(raw.mode) ? raw.mode : 'parking',
    }),
    stringify: ({ mode }) => ({
      // Omit parking so the default mode stays at `/`
      mode: mode === 'parking' ? undefined : mode,
    }),
  },
  validateSearch: mapSearchSchema,
  component: ModePage,
})

function ModePage() {
  const search = Route.useSearch()
  const cookieLocation = getLocationFromCookie()

  const initialView = {
    longitude: search.map?.lng ?? cookieLocation?.location.lng ?? 13.453,
    latitude: search.map?.lat ?? cookieLocation?.location.lat ?? 52.472,
    zoom: search.map?.zoom ?? cookieLocation?.zoom ?? 13,
    bearing: search.map?.bearing,
  }

  return <MapPage initialView={initialView} />
}
