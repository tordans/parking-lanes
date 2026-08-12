import { type NormalizedPhoto } from '@osm-editor-kit/street-imagery'
import {
  useAllProviderPhotos,
  useMapViewportBbox,
  useViewerBearing,
  useViewerHfov,
  useViewerLngLat,
} from '@osm-editor-kit/street-imagery-react'
import { useSearch } from '@tanstack/react-router'
import { useMemo } from 'react'
import { MAIN_MAP_ID } from './map-ids'
import { useMapViewport } from './map-viewport'
import { resolvePhotoDateFilter } from './photo-date-slider'
import type { PhotoSearchSelection } from './street-imagery-search-params'

/** Enough for Mapillary/Panoramax viewers when the photo is not yet in viewport data. */
function stubPhotoFromSearch(photo: PhotoSearchSelection): NormalizedPhoto {
  return {
    providerId: photo.provider,
    photoId: photo.photoId,
    sequenceId: photo.sequenceId ?? null,
    capturedAt: null,
    isPano: null,
    heading: null,
    lngLat: [0, 0],
  }
}

export function useSelectedPhotoForMap(): {
  selectedPhoto: NormalizedPhoto | null
  selectedSequenceId: string | null
  groupPhotos: NormalizedPhoto[]
  viewerPov: {
    bearing: number | null
    hfov: number | null
    lngLat: [number, number] | null
  }
} {
  const { photo, photos = [], photoTypes, photoDate } = useSearch({ from: '/$mode' })
  const map = useMapViewport()
  const bbox = useMapViewportBbox(MAIN_MAP_ID, map)
  const dateFilter = useMemo(
    () => resolvePhotoDateFilter(photoDate, photos.length > 0),
    [photoDate, photos.length],
  )

  const { photos: allPhotos } = useAllProviderPhotos(photos, bbox, map.zoom, photoTypes, dateFilter)

  const selectedPhoto = useMemo(() => {
    if (!photo) return null
    const match = allPhotos.find(
      (candidate) =>
        candidate.providerId === photo.provider &&
        String(candidate.photoId) === String(photo.photoId),
    )
    // Stub so Mapillary/Panoramax viewers can open even before viewport data catches up.
    return match ?? stubPhotoFromSearch(photo)
  }, [allPhotos, photo])

  const groupPhotos = useMemo(() => {
    if (!selectedPhoto) return []
    const sequenceId = selectedPhoto.sequenceId
    if (!sequenceId) return [selectedPhoto]
    const fromViewport = allPhotos.filter(
      (candidate) =>
        candidate.providerId === selectedPhoto.providerId && candidate.sequenceId === sequenceId,
    )
    return fromViewport.length > 0 ? fromViewport : [selectedPhoto]
  }, [allPhotos, selectedPhoto])

  const bearing = useViewerBearing()
  const hfov = useViewerHfov()
  const lngLat = useViewerLngLat()

  return {
    selectedPhoto,
    selectedSequenceId: photo?.sequenceId ?? selectedPhoto?.sequenceId ?? null,
    groupPhotos,
    viewerPov: { bearing, hfov, lngLat },
  }
}
