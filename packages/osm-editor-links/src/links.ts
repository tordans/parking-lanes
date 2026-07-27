import type { LatLngLiteral } from '@osm-editor-kit/osm-data'
import { type OsmNode, type OsmRelation, type OsmWay } from '@osm-editor-kit/osm-data'

export const josmUrl = 'http://127.0.0.1:8111/import?url='

export const osmProdUrl = 'https://www.openstreetmap.org'
/** Production OSM API host (OAuth, map downloads, changeset upload). */
export const osmProdApiUrl = 'https://api.openstreetmap.org'
export const osmDevUrl = 'https://master.apis.dev.openstreetmap.org'

export function mapillaryUrl(center: LatLngLiteral, options?: MapillaryUrlOptions) {
  const params = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
    z: '17',
    focus: 'map',
    trafficSign: 'all',
  })

  if (options?.dateFrom) params.set('dateFrom', options.dateFrom)
  if (options?.dateTo) params.set('dateTo', options.dateTo)
  if (options?.panosOnly) params.set('panos', 'true')

  return `https://www.mapillary.com/app/?${params.toString()}`
}

export type MapillaryUrlOptions = {
  /** UTC calendar date (`YYYY-MM-DD`) for Mapillary's `dateFrom` filter. */
  dateFrom?: string
  /** UTC calendar date (`YYYY-MM-DD`) for Mapillary's `dateTo` filter. */
  dateTo?: string
  /** When true, adds `panos=true` (360° imagery only). */
  panosOnly?: boolean
}

const MAPILLARY_RECENT_PANOS_YEARS = 3

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

interface idEditorUrlProps {
  center?: LatLngLiteral
  zoom?: number
  background?: string
  osmObjectType?: OsmRelation['type'] | OsmWay['type'] | OsmNode['type']
  osmObjectId?: number | string
}

export function idEditorUrl({
  center,
  zoom,
  background,
  osmObjectType,
  osmObjectId,
}: idEditorUrlProps) {
  const params: Record<string, string> = {
    disable_features: 'boundaries',
    photo_overlay: 'streetside,mapillary,kartaview',
  }
  if (zoom && center) params.map = `${zoom}/${center.lat}/${center.lng}`
  if (background) params.background = background
  if (osmObjectType && osmObjectId) params.id = `${osmObjectType.charAt(0)}${osmObjectId}`
  const hashUrlParams = new URLSearchParams(params)

  return `https://ideditor-release.netlify.app/#${hashUrlParams.toString()}`
}
