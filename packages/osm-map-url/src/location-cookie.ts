import type { LatLngLiteral } from './geo'

export interface LocationAndZoom {
  location: LatLngLiteral
  zoom: number
}

export function setLocationToCookie(center: LatLngLiteral, zoom: number): void {
  const date = new Date(new Date().getTime() + 10 * 365 * 24 * 60 * 60 * 1000)
  document.cookie = 'location=' + zoom + '/' + center.lat + '/' + center.lng + '; expires=' + date
}

export function getLocationFromCookie(): LocationAndZoom | undefined {
  const locationCookie = document.cookie.split('; ').find((e) => e.startsWith('location='))
  if (locationCookie == null) return undefined

  const rawLocation = locationCookie.split('=')[1]!.split('/')
  const location: LatLngLiteral = {
    lat: parseFloat(rawLocation[1]!),
    lng: parseFloat(rawLocation[2]!),
  }
  const zoom = parseInt(rawLocation[0]!)

  return { location, zoom }
}
