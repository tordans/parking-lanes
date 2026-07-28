import { routerSearch } from '@osm-editor-kit/osm-map-url'
import { type MapFocus, serializeFocusParam } from './search-schema'

/**
 * App wrapper around package `routerSearch`: keeps Layer 1 pretty JSON, and
 * encodes `focus` as a compact `key:value,…` string so share URLs avoid `%22`.
 */
export const appRouterSearch = {
  parse: routerSearch.parse,
  stringify: (search: Record<string, unknown>) => {
    const focus = search.focus
    if (typeof focus === 'object' && focus != null && !Array.isArray(focus)) {
      return routerSearch.stringify({
        ...search,
        focus: serializeFocusParam(focus as MapFocus),
      })
    }
    return routerSearch.stringify(search)
  },
}
