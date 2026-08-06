import { getStreetImageryConfig } from '../config'
import type { NormalizedPhoto } from '../providers/model'
import { buildStreetsidePreviewUrl } from './streetsidePreview'

type MapillaryThumbResponse = {
  thumb_1024_url?: string
}

type PanoramaxItemResponse = {
  assets?: {
    sd?: { href?: string }
    hd?: { href?: string }
  }
}

type MapilioSequenceItem = {
  id?: number | string
  filename?: string
  uploaded_hash?: string
}

// The API returns `{ data: [...] }`; iD's docs suggested `{ data: { data: [...] } }` — accept both.
type MapilioSequenceResponse = {
  data?: MapilioSequenceItem[] | { data?: MapilioSequenceItem[] }
}

const mapilioCdnUrl = (uploadedHash: string, filename: string, size: '1080' | '2080') =>
  `https://cdn.mapilio.com/im/${uploadedHash}/${filename}/${size}`

export const fetchMapilioSequenceItem = async (
  sequenceId: string,
  photoId: string,
): Promise<MapilioSequenceItem | null> => {
  const response = await fetch(
    `https://end.mapilio.com/api/sequence-detail?sequence_uuid=${encodeURIComponent(sequenceId)}`,
  )
  if (!response.ok) {
    throw new Error(`Mapilio sequence detail failed (${response.status})`)
  }

  const data = (await response.json()) as MapilioSequenceResponse
  const items = Array.isArray(data.data) ? data.data : (data.data?.data ?? [])
  const match = items.find((item) => String(item.id) === photoId)
  return match ?? null
}

export const fetchMapillaryThumbnail = async (photoId: string): Promise<string | null> => {
  const url = new URL(`https://graph.mapillary.com/${photoId}`)
  url.searchParams.set('fields', 'thumb_1024_url')
  url.searchParams.set('access_token', getStreetImageryConfig().mapillaryToken)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Mapillary thumbnail failed (${response.status})`)
  }

  const data = (await response.json()) as MapillaryThumbResponse
  return data.thumb_1024_url ?? null
}

export const fetchPanoramaxThumbnail = async (
  sequenceId: string,
  photoId: string,
): Promise<string | null> => {
  const base = getStreetImageryConfig().panoramaxApiBase
  const response = await fetch(
    `${base}/api/collections/${encodeURIComponent(sequenceId)}/items/${encodeURIComponent(photoId)}`,
  )
  if (!response.ok) {
    throw new Error(`Panoramax thumbnail failed (${response.status})`)
  }

  const data = (await response.json()) as PanoramaxItemResponse
  return data.assets?.sd?.href ?? data.assets?.hd?.href ?? null
}

export const fetchMapilioThumbnail = async (
  sequenceId: string,
  photoId: string,
): Promise<string | null> => {
  const match = await fetchMapilioSequenceItem(sequenceId, photoId)
  if (!match?.uploaded_hash || !match.filename) {
    return null
  }

  return mapilioCdnUrl(match.uploaded_hash, match.filename, '1080')
}

export const fetchMapilioFullUrl = async (
  sequenceId: string,
  photoId: string,
): Promise<string | null> => {
  const match = await fetchMapilioSequenceItem(sequenceId, photoId)
  if (!match?.uploaded_hash || !match.filename) {
    return null
  }

  return mapilioCdnUrl(match.uploaded_hash, match.filename, '2080')
}

export const resolvePhotoFullUrl = async (photo: NormalizedPhoto): Promise<string | null> => {
  if (photo.providerId === 'streetview' || photo.providerId === 'lookaround') {
    return null
  }

  if (photo.fullUrl) {
    return photo.fullUrl
  }

  switch (photo.providerId) {
    case 'mapilio':
      if (!photo.sequenceId) {
        return null
      }
      return fetchMapilioFullUrl(photo.sequenceId, photo.photoId)
    case 'kartaview':
    case 'vegbilder':
      return photo.thumbUrl ?? null
    case 'mapillary': {
      throw new Error('Not implemented yet: "mapillary" case')
    }
    case 'mapillary-map-features': {
      throw new Error('Not implemented yet: "mapillary-map-features" case')
    }
    case 'mapillary-signs': {
      throw new Error('Not implemented yet: "mapillary-signs" case')
    }
    case 'panoramax': {
      throw new Error('Not implemented yet: "panoramax" case')
    }
    case 'streetside': {
      throw new Error('Not implemented yet: "streetside" case')
    }
    default:
      return null
  }
}

export const resolvePhotoPanoramaUrl = async (photo: NormalizedPhoto): Promise<string | null> => {
  const fullUrl = await resolvePhotoFullUrl(photo)
  if (fullUrl) {
    return fullUrl
  }
  return photo.thumbUrl ?? null
}

export const resolvePhotoThumbnailUrl = async (photo: NormalizedPhoto): Promise<string | null> => {
  if (photo.providerId === 'streetview' || photo.providerId === 'lookaround') {
    return null
  }

  if (photo.thumbUrl) {
    if (photo.providerId === 'streetside') {
      return buildStreetsidePreviewUrl(photo.thumbUrl)
    }
    return photo.thumbUrl
  }

  switch (photo.providerId) {
    case 'mapillary':
      return fetchMapillaryThumbnail(photo.photoId)
    case 'panoramax':
      if (!photo.sequenceId) {
        return null
      }
      return fetchPanoramaxThumbnail(photo.sequenceId, photo.photoId)
    case 'mapilio':
      if (!photo.sequenceId) {
        return null
      }
      return fetchMapilioThumbnail(photo.sequenceId, photo.photoId)
    // These providers deliver thumbUrl with the photo data; without it there is no fallback fetch.
    case 'kartaview':
    case 'streetside':
    case 'vegbilder':
      return null
    case 'mapillary-map-features':
    case 'mapillary-signs':
      return null
    default:
      return null
  }
}

export const photoFullUrlQueryKey = (photo: NormalizedPhoto) =>
  ['photo-full-url', photo.providerId, photo.sequenceId, photo.photoId] as const

export const photoThumbnailQueryKey = (photo: NormalizedPhoto) =>
  ['photo-thumbnail', photo.providerId, photo.sequenceId, photo.photoId] as const
