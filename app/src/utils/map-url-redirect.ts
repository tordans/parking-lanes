import { parseLegacyMapHash, serializeMapParam } from './map-param'

export function redirectLegacyMapHash() {
  const parsed = parseLegacyMapHash(window.location.hash)
  if (!parsed) return

  const url = new URL(window.location.href)
  url.searchParams.set('map', serializeMapParam(parsed))
  url.hash = ''

  window.history.replaceState(null, '', url.toString())
}
