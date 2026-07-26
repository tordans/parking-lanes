import { getLocationFromCookie, type MapParam } from '@osm-editor-kit/osm-map-url'
import { useSearch } from '@tanstack/react-router'

function defaultMapParam(): MapParam {
  const cookie = getLocationFromCookie()
  return {
    zoom: cookie?.zoom ?? 13,
    lat: cookie?.location.lat ?? 52.4707,
    lng: cookie?.location.lng ?? 13.4321,
  }
}

/** Map viewport from router search (`map` param) — single source of truth for zoom, center, bearing. */
export function useMapViewport(): MapParam {
  const { map } = useSearch({ from: '/$mode' })
  return map ?? defaultMapParam()
}
