import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { type MapSearch, serializeMapSearch } from './search-schema'

const modeRouteApi = getRouteApi('/$mode')

type UpdateSearchOptions = {
  replace?: boolean
}

/**
 * Search-only URL updates for the map/editor (TILDA `useRegionSearchNavigation` pattern).
 *
 * Uses an unscoped `navigate` so only the query string changes — never re-resolves
 * `/$mode`. Skips writes once that route is gone (MapLibre teardown after leaving for
 * `/audit-lanes` / `/audit-width`).
 */
export function useModeSearchNavigation() {
  const search = modeRouteApi.useSearch()
  const navigate = useNavigate()
  const router = useRouter()

  function updateSearch(
    partial: Partial<MapSearch> | ((prev: MapSearch) => Partial<MapSearch>),
    options?: UpdateSearchOptions,
  ) {
    if (!router.state.matches.some((match) => match.routeId === '/$mode')) return

    void navigate({
      // Unscoped search updater: keep the current pathname.
      search: ((prev: MapSearch) => {
        const updates = typeof partial === 'function' ? partial(prev) : partial
        return serializeMapSearch({ ...prev, ...updates })
      }) as never,
      replace: options?.replace,
    })
  }

  return { search, updateSearch }
}
