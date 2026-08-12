import type { Feature, FeatureCollection, Polygon } from 'geojson'
import type { NormalizedPhoto } from '../providers/model'
import { coneRadiusMeters, viewConeGeoJson } from './viewCone'

/** Narrow heading wedge for flat (directional) photos — iD-style viewfield. */
export const FLAT_VIEWFIELD_FOV_DEG = 55

/** Full disk for 360° / equirectangular photos. */
export const PANO_VIEWFIELD_FOV_DEG = 360

const METERS_PER_DEGREE_LAT = 111_320

const normalizeBearing = (bearingDeg: number): number => ((bearingDeg % 360) + 360) % 360

const offsetMeters = (
  lng: number,
  lat: number,
  bearingDeg: number,
  distanceMeters: number,
): [number, number] => {
  const bearingRad = (bearingDeg * Math.PI) / 180
  const northMeters = Math.cos(bearingRad) * distanceMeters
  const eastMeters = Math.sin(bearingRad) * distanceMeters
  const cosLat = Math.cos((lat * Math.PI) / 180)
  const metersPerDegreeLng = METERS_PER_DEGREE_LAT * Math.max(cosLat, 1e-6)

  return [lng + eastMeters / metersPerDegreeLng, lat + northMeters / METERS_PER_DEGREE_LAT]
}

/** Lightweight triangle wedge (apex + left/right rays) for dense coverage layers. */
export const flatViewfieldTriangle = (
  lngLat: [number, number],
  bearingDeg: number,
  fovDeg: number,
  radiusMeters: number,
): Feature<Polygon> => {
  const [lng, lat] = lngLat
  const center = normalizeBearing(bearingDeg)
  const half = Math.max(fovDeg, 0) / 2
  const left = offsetMeters(lng, lat, center - half, radiusMeters)
  const right = offsetMeters(lng, lat, center + half, radiusMeters)

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[lng, lat], left, right, [lng, lat]]],
    },
  }
}

export type ViewfieldPhotoProps = {
  providerId: string
  photoId: string
  sequenceId: string | null
  capturedAt: number | null
  isPano: boolean | null
  heading: number | null
}

/**
 * Build viewfield polygons for every photo that can show direction:
 * - panorama → full 360° disk
 * - flat with heading → narrow triangle wedge
 * Photos without heading that are not panos are skipped.
 */
export const photosToViewfieldsFeatureCollection = (
  photos: NormalizedPhoto[],
  zoom: number,
): FeatureCollection<Polygon, ViewfieldPhotoProps> => {
  const radius = coneRadiusMeters(zoom)
  const features: Feature<Polygon, ViewfieldPhotoProps>[] = []

  for (const photo of photos) {
    const isPano = photo.isPano === true
    if (!isPano && photo.heading == null) continue

    const props: ViewfieldPhotoProps = {
      providerId: photo.providerId,
      photoId: photo.photoId,
      sequenceId: photo.sequenceId,
      capturedAt: photo.capturedAt,
      isPano: photo.isPano,
      heading: photo.heading,
    }

    if (isPano) {
      const bearing = photo.heading ?? 0
      const disk = viewConeGeoJson(photo.lngLat, bearing, PANO_VIEWFIELD_FOV_DEG, radius)
      features.push({ ...disk, properties: props })
      continue
    }

    const triangle = flatViewfieldTriangle(
      photo.lngLat,
      photo.heading!,
      FLAT_VIEWFIELD_FOV_DEG,
      radius,
    )
    features.push({ ...triangle, properties: props })
  }

  return { type: 'FeatureCollection', features }
}

export const emptyPolygonCollection = (): FeatureCollection<Polygon> => ({
  type: 'FeatureCollection',
  features: [],
})
