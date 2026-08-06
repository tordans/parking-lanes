import { featureLayerId, photoLayerId, type ProviderId } from '@osm-editor-kit/street-imagery'
import type { MapGeoJSONFeature } from 'maplibre-gl'

export type StreetImageryClickFeature = {
  providerId: ProviderId
  kind: 'photo' | 'mapFeature'
  photoId?: string
  featureId?: string
  sequenceId?: string
}

export const streetImageryInteractiveLayerIds = (providers: ProviderId[]): string[] => [
  ...providers.map((providerId) => photoLayerId(providerId)),
  ...providers.map((providerId) => featureLayerId(providerId)),
]

const parseProviderIdFromLayerId = (layerId: string): ProviderId | null => {
  const photoMatch = layerId.match(/^photos-(.+)$/)
  if (photoMatch) {
    return photoMatch[1] as ProviderId
  }
  const featureMatch = layerId.match(/^features-(.+)$/)
  if (featureMatch) {
    return featureMatch[1] as ProviderId
  }
  return null
}

export const queryStreetImageryFeatures = (event: {
  features?: MapGeoJSONFeature[] | null
}): StreetImageryClickFeature[] => {
  const features = event.features ?? []
  const results: StreetImageryClickFeature[] = []

  for (const feature of features) {
    const layerId = feature.layer?.id
    if (!layerId) {
      continue
    }

    const providerId = parseProviderIdFromLayerId(layerId)
    if (!providerId) {
      continue
    }

    const props = feature.properties ?? {}

    if (layerId.startsWith('photos-')) {
      const photoId = props.photoId
      if (photoId == null) {
        continue
      }
      results.push({
        providerId,
        kind: 'photo',
        photoId: String(photoId),
        sequenceId: props.sequenceId != null ? String(props.sequenceId) : undefined,
      })
      continue
    }

    if (layerId.startsWith('features-')) {
      const featureId = props.featureId
      if (featureId == null) {
        continue
      }
      results.push({
        providerId,
        kind: 'mapFeature',
        featureId: String(featureId),
      })
    }
  }

  return results
}
