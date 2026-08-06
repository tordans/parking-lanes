import { photoGroupSequenceId, type NormalizedPhoto } from '@osm-editor-kit/street-imagery'
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

  const { photos: allPhotos } = useAllProviderPhotos(photos, bbox, map.zoom, photoTypes, photoDate)

  const selectedPhoto = useMemo(() => {
    if (!photo) return null
    return (
      allPhotos.find(
        (candidate) =>
          candidate.providerId === photo.provider &&
          candidate.photoId === photo.photoId &&
          photoGroupSequenceId(candidate) === (photo.sequenceId ?? `photo:${photo.photoId}`),
      ) ?? null
    )
  }, [allPhotos, photo])

  const groupPhotos = useMemo(() => {
    if (!selectedPhoto) return []
    const sequenceId = selectedPhoto.sequenceId
    if (!sequenceId) return [selectedPhoto]
    return allPhotos.filter(
      (candidate) =>
        candidate.providerId === selectedPhoto.providerId && candidate.sequenceId === sequenceId,
    )
  }, [allPhotos, selectedPhoto])

  const bearing = useViewerBearing()
  const hfov = useViewerHfov()
  const lngLat = useViewerLngLat()

  return {
    selectedPhoto,
    selectedSequenceId: photo?.sequenceId ?? selectedPhoto?.sequenceId ?? null,
    groupPhotos: groupPhotos.length > 0 ? groupPhotos : selectedPhoto ? [selectedPhoto] : [],
    viewerPov: { bearing, hfov, lngLat },
  }
}
