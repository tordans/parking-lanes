import { getLocationFromCookie, type MapParam } from '@osm-editor-kit/osm-map-url'
import { useSearch } from '@tanstack/react-router'

function defaultMapParam(): MapParam {
  const cookie = getLocationFromCookie()
  return {
    zoom: cookie?.zoom ?? 5,
    lat: cookie?.location.lat ?? 51.591,
    lng: cookie?.location.lng ?? 24.609,
  }
}

/** Map viewport from router search (`map` param) — single source of truth for zoom, center, bearing. */
export function useMapViewport(): MapParam {
  const { map } = useSearch({ from: '/' })
  return map ?? defaultMapParam()
}
