import {
  StreetLevelImagerySourcesAndLayers,
  useMapViewportBbox,
  type PhotoFilter,
} from '@osm-editor-kit/street-imagery-react'
import { useSearch } from '@tanstack/react-router'
import type { ExpressionSpecification } from 'maplibre-gl'
import { MAIN_MAP_ID } from './map-ids'
import { useMapViewport } from './map-viewport'
import { getStreetImageryRuntimeConfig } from './street-imagery-config'
import { useSelectedPhotoForMap } from './use-selected-photo-for-map'

const PHOTO_CIRCLE_COLOR: ExpressionSpecification = [
  'match',
  ['get', 'providerId'],
  'mapillary',
  '#05CB63',
  'panoramax',
  '#7C3AED',
  '#64748b',
]

const MAP_FEATURE_CIRCLE_COLOR = '#94a3b8'

export function MapStreetImageryLayers() {
  const { photos = [], photoTypes, photoDate } = useSearch({ from: '/$mode' })
  const map = useMapViewport()
  const bbox = useMapViewportBbox(MAIN_MAP_ID, map)
  const { selectedPhoto, selectedSequenceId, viewerPov } = useSelectedPhotoForMap()

  if (photos.length === 0) return null

  const filter: PhotoFilter = {
    photoTypes,
    date: photoDate,
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
        showViewCone: true,
        showSelectionHighlight: true,
        selectedPhoto,
        selectedSequenceId,
        viewerPov,
        photoCircleColor: PHOTO_CIRCLE_COLOR,
        mapFeatureCircleColor: MAP_FEATURE_CIRCLE_COLOR,
      }}
    />
  )
}
