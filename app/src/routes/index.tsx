import { pickOauthCallbackSearch } from '@osm-editor-kit/osm-oauth'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { mapSearchSchema, serializeMapSearch } from '../shell/map/search-schema'

/** Root entry: send first load to the parking mode slug. */
export const Route = createFileRoute('/')({
  validateSearch: mapSearchSchema,
  beforeLoad: ({ search, location }) => {
    throw redirect({
      to: '/$mode',
      params: { mode: 'parking' },
      // Keep OAuth callback keys so redirect login can finish after this hop.
      search: { ...serializeMapSearch(search), ...pickOauthCallbackSearch(location.searchStr) },
      replace: true,
    })
  },
})
