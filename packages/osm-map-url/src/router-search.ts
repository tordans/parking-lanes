import { parseSearchWith, stringifySearchWith } from '@tanstack/react-router'
import { type OsmFeatureRef, serializeFeatureParam } from './feature-param'
import { type MapParam, serializeMapParam } from './map-param'

const parseSearch = parseSearchWith(JSON.parse)
const stringifySearchDefault = stringifySearchWith(JSON.stringify)

function makeSearchPretty(searchString: string) {
  return searchString
    .replaceAll('%22', '"')
    .replaceAll('%2C', ',')
    .replaceAll('%27', "'")
    .replaceAll('%28', '(')
    .replaceAll('%29', ')')
    .replaceAll('%2F', '/')
    .replaceAll('%3A', ':')
    .replaceAll('%3B', ';')
    .replaceAll('%5B', '[')
    .replaceAll('%5D', ']')
    .replaceAll('%7B', '{')
    .replaceAll('%7D', '}')
}

function isMapParam(value: unknown): value is MapParam {
  if (typeof value !== 'object' || value == null) return false
  const map = value as Record<string, unknown>
  return (
    typeof map.zoom === 'number' &&
    typeof map.lat === 'number' &&
    typeof map.lng === 'number' &&
    (map.bearing === undefined || typeof map.bearing === 'number')
  )
}

function isFeatureRef(value: unknown): value is OsmFeatureRef {
  if (typeof value !== 'object' || value == null) return false
  const feature = value as Record<string, unknown>
  return (
    (feature.type === 'way' || feature.type === 'node' || feature.type === 'relation') &&
    typeof feature.id === 'number'
  )
}

/** Keep ?map=zoom/lat/lng (tilda-geo), not JSON objects in the URL bar. */
function normalizeSearchForStringify(search: Record<string, unknown>): Record<string, unknown> {
  let result = search
  if (isMapParam(search.map)) {
    result = { ...result, map: serializeMapParam(search.map) }
  }
  if (isFeatureRef(search.f)) {
    result = { ...result, f: serializeFeatureParam(search.f) }
  }
  return result
}

export const routerSearch = {
  parse: parseSearch,
  stringify: (search: Record<string, unknown>) =>
    makeSearchPretty(stringifySearchDefault(normalizeSearchForStringify(search))),
}
