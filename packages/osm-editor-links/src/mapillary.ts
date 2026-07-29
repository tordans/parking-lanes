import type { LatLngLiteral } from '@osm-editor-kit/osm-data'

export type MapillaryUrlOptions = {
  /** UTC calendar date (`YYYY-MM-DD`) for Mapillary's `dateFrom` filter. */
  dateFrom?: string
  /** UTC calendar date (`YYYY-MM-DD`) for Mapillary's `dateTo` filter. */
  dateTo?: string
  /** When true, adds `panos=true` (360° imagery only). */
  panosOnly?: boolean
  /** Map zoom; defaults to 17. */
  zoom?: number
  /** When set, adds `trafficSign=` (default `all` when omitted from options entirely uses `all`). */
  trafficSign?: 'all' | false
}

const MAPILLARY_RECENT_PANOS_YEARS = 3

export function mapillaryUrl(center: LatLngLiteral, options?: MapillaryUrlOptions) {
  const trafficSign = options?.trafficSign === false ? undefined : (options?.trafficSign ?? 'all')
  const params = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
    z: String(options?.zoom ?? 17),
    focus: 'map',
  })

  if (trafficSign) params.set('trafficSign', trafficSign)
  if (options?.dateFrom) params.set('dateFrom', options.dateFrom)
  if (options?.dateTo) params.set('dateTo', options.dateTo)
  if (options?.panosOnly) params.set('panos', 'true')

  return `https://www.mapillary.com/app/?${params.toString()}`
}

/** Panorama imagery from the last few years — useful for kerbside parking signs. */
export function mapillaryRecentPanosUrl(
  center: LatLngLiteral,
  options?: { years?: number; referenceDate?: Date },
) {
  const referenceDate = options?.referenceDate ?? new Date()
  const years = options?.years ?? MAPILLARY_RECENT_PANOS_YEARS
  const dateTo = formatMapillaryUtcDate(referenceDate)
  const dateFromDate = new Date(referenceDate)
  dateFromDate.setUTCFullYear(dateFromDate.getUTCFullYear() - years)

  return mapillaryUrl(center, {
    dateFrom: formatMapillaryUtcDate(dateFromDate),
    dateTo,
    panosOnly: true,
  })
}

function formatMapillaryUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
