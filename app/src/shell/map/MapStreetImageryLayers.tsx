import {
  StreetLevelImagerySourcesAndLayers,
  useMapViewportBbox,
  type PhotoFilter,
} from '@osm-editor-kit/street-imagery-react'
import { useSearch } from '@tanstack/react-router'
import { useMemo } from 'react'
import { MAIN_MAP_ID } from './map-ids'
import { useMapViewport } from './map-viewport'
import { photoAgeCircleColorExpression } from './photo-age-style'
import { resolvePhotoDateFilter } from './photo-date-slider'
import { getStreetImageryRuntimeConfig } from './street-imagery-config'
import { useSelectedPhotoForMap } from './use-selected-photo-for-map'

const MAP_FEATURE_CIRCLE_COLOR = '#94a3b8'

export function MapStreetImageryLayers() {
  const { photos = [], photoTypes, photoDate } = useSearch({ from: '/$mode' })
  const map = useMapViewport()
  const bbox = useMapViewportBbox(MAIN_MAP_ID, map)
  const { selectedPhoto, selectedSequenceId, viewerPov } = useSelectedPhotoForMap()
  const photoCircleColor = photoAgeCircleColorExpression()
  const dateFilter = useMemo(
    () => resolvePhotoDateFilter(photoDate, photos.length > 0),
    [photoDate, photos.length],
  )

  if (photos.length === 0) return null

  const filter: PhotoFilter = {
    photoTypes,
    date: dateFilter,
  }

  return (
    <StreetLevelImagerySourcesAndLayers
      providers={photos}
      bbox={bbox}
      zoom={map.zoom}
      filter={filter}
      options={{
        config: getStreetImageryRuntimeConfig(),
        showSequences: true,
        showViewfields: true,
        showViewCone: true,
        showSelectionHighlight: true,
        selectedPhoto,
        selectedSequenceId,
        viewerPov,
        photoCircleColor,
        mapFeatureCircleColor: MAP_FEATURE_CIRCLE_COLOR,
      }}
    />
  )
}
