import type { DateRange, PhotoTypeFilter } from '@osm-editor-kit/street-imagery'
import { photoMatchesFilters } from '@osm-editor-kit/street-imagery'
import type { Bbox, NormalizedPhoto } from '@osm-editor-kit/street-imagery'
import {
  isBrowserAvailableProvider,
  PROVIDER_IDS,
  type ProviderId,
} from '@osm-editor-kit/street-imagery'
import { useProviderPhotos } from './useProviderData'

export type AllProviderPhotosResult = {
  photos: NormalizedPhoto[]
  isLoading: boolean
  isFetching: boolean
}

const useProviderPhotosMaybe = (
  providerId: ProviderId,
  enabled: boolean,
  bbox: Bbox | null,
  zoom: number,
) => useProviderPhotos(providerId, enabled ? bbox : null, zoom)

export const useAllProviderPhotos = (
  providerIds: ProviderId[],
  bbox: Bbox | null,
  zoom: number,
  photoTypes?: PhotoTypeFilter[],
  date?: DateRange,
): AllProviderPhotosResult => {
  const enabled = new Set(providerIds)

  const queries = PROVIDER_IDS.map((providerId) => ({
    providerId,
    query: useProviderPhotosMaybe(
      providerId,
      enabled.has(providerId) && isBrowserAvailableProvider(providerId),
      bbox,
      zoom,
    ),
  }))

  const photos = queries.flatMap(({ query }) => {
    const data = query.data ?? []
    return data.filter((photo) => photoMatchesFilters(photo, photoTypes, date))
  })

  const activeQueries = queries.filter(({ providerId }) => enabled.has(providerId))
  const isLoading = activeQueries.some(({ query }) => query.isLoading)
  const isFetching = activeQueries.some(({ query }) => query.isFetching)

  return { photos, isLoading, isFetching }
}
