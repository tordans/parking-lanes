import type { LineString, MultiLineString } from 'geojson'

export const PROVIDER_IDS = [
  'mapillary',
  'panoramax',
  'kartaview',
  'mapilio',
  'streetside',
  'vegbilder',
  'streetview',
  'lookaround',
  'mapillary-signs',
  'mapillary-map-features',
] as const

export type ProviderId = (typeof PROVIDER_IDS)[number]

/** Bounding box as [west, south, east, north] in WGS84 degrees. */
export type Bbox = [west: number, south: number, east: number, north: number]

export type TileCoord = {
  z: number
  x: number
  y: number
}

export type ProviderKind = 'photo' | 'mapFeature'

export type NormalizedPhoto = {
  providerId: ProviderId
  photoId: string
  sequenceId: string | null
  /** KartaView sequence_index for deep links; undefined for other providers. */
  sequenceIndex?: number
  capturedAt: number | null
  isPano: boolean | null
  heading: number | null
  lngLat: [number, number]
  /** Direct thumbnail URL when the list API already provides one. */
  thumbUrl?: string
  /** Full-resolution image URL when the list API already provides one. */
  fullUrl?: string
  /** Vegbilder atlas year for external viewer links. */
  viewerYear?: number
  /** Bing Streetside cubemap tile template from the metadata API. */
  streetside?: {
    urlTemplate: string
    subdomains: string[]
  }
}

export type NormalizedMapFeature = {
  providerId: ProviderId
  featureId: string
  value: string
  firstSeenAt: number | null
  lastSeenAt: number | null
  lngLat: [number, number]
}

export type NormalizedSequence = {
  providerId: ProviderId
  sequenceId: string
  geometry: LineString | MultiLineString
}

export type ProviderAdapter = {
  id: ProviderId
  kind: ProviderKind
  label: string
  color: string
  /** Minimum map zoom before photo markers are fetched. */
  minZoom: number
  /** Minimum map zoom before sequence lines are fetched (defaults to minZoom). */
  sequencesMinZoom?: number
  /** When false, provider is omitted from the default enabled set. */
  defaultEnabled?: boolean
  /** When set, map layers cannot load in the browser (e.g. upstream CORS). */
  browserUnavailableReason?: string
  fetchPhotos?: (bbox: Bbox, zoom: number, signal: AbortSignal) => Promise<NormalizedPhoto[]>
  fetchSequences?: (bbox: Bbox, zoom: number, signal: AbortSignal) => Promise<NormalizedSequence[]>
  fetchMapFeatures?: (
    bbox: Bbox,
    zoom: number,
    signal: AbortSignal,
  ) => Promise<NormalizedMapFeature[]>
}
