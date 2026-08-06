import type { FeatureCollection, LineString, MultiLineString, Point } from 'geojson'
import type { NormalizedMapFeature, NormalizedPhoto, NormalizedSequence } from '../providers/model'

export const photosToFeatureCollection = (photos: NormalizedPhoto[]): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: photos.map((photo) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: photo.lngLat,
    },
    properties: {
      providerId: photo.providerId,
      photoId: photo.photoId,
      sequenceId: photo.sequenceId,
      capturedAt: photo.capturedAt,
      isPano: photo.isPano,
      heading: photo.heading,
    },
  })),
})

export const mapFeaturesToFeatureCollection = (
  features: NormalizedMapFeature[],
): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: features.map((feature) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: feature.lngLat,
    },
    properties: {
      providerId: feature.providerId,
      featureId: feature.featureId,
      value: feature.value,
      firstSeenAt: feature.firstSeenAt,
      lastSeenAt: feature.lastSeenAt,
    },
  })),
})

export const sequencesToFeatureCollection = (
  sequences: NormalizedSequence[],
): FeatureCollection<LineString | MultiLineString> => ({
  type: 'FeatureCollection',
  features: sequences.map((sequence) => ({
    type: 'Feature',
    geometry: sequence.geometry,
    properties: {
      providerId: sequence.providerId,
      sequenceId: sequence.sequenceId,
    },
  })),
})

export const emptyPointCollection = (): FeatureCollection<Point> => ({
  type: 'FeatureCollection',
  features: [],
})

export const emptyLineCollection = (): FeatureCollection<LineString | MultiLineString> => ({
  type: 'FeatureCollection',
  features: [],
})
