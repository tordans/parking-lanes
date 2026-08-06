import { describe, expect, it } from 'bun:test'
import type { NormalizedMapFeature, NormalizedPhoto } from '../providers/model'
import {
  mapFeatureMatchesDateRange,
  normalizeDateRange,
  photoMatchesDateRange,
  photoMatchesFilters,
  photoMatchesPhotoTypes,
  photoTypesFilter,
} from './searchFilters'

const photo = (overrides: Partial<NormalizedPhoto> = {}): NormalizedPhoto => ({
  providerId: 'mapillary',
  photoId: 'p1',
  sequenceId: 'seq-1',
  capturedAt: Date.UTC(2024, 5, 15),
  isPano: false,
  heading: null,
  lngLat: [13.4, 52.5],
  ...overrides,
})

const mapFeature = (overrides: Partial<NormalizedMapFeature> = {}): NormalizedMapFeature => ({
  providerId: 'mapillary-signs',
  featureId: 'f1',
  value: 'regulatory--stop--g1',
  firstSeenAt: Date.UTC(2023, 0, 1),
  lastSeenAt: Date.UTC(2025, 0, 1),
  lngLat: [13.4, 52.5],
  ...overrides,
})

describe('normalizeDateRange', () => {
  it('swaps from and to when from is after to', () => {
    expect(normalizeDateRange({ from: '2025-06-01', to: '2024-01-01' })).toEqual({
      from: '2024-01-01',
      to: '2025-06-01',
    })
  })

  it('returns undefined when both dates are absent', () => {
    expect(normalizeDateRange({})).toBeUndefined()
    expect(normalizeDateRange(undefined)).toBeUndefined()
  })
})

describe('photoTypesFilter', () => {
  it('treats both types as no filter', () => {
    expect(photoTypesFilter(['flat', 'pano'])).toBeUndefined()
    expect(photoTypesFilter(undefined)).toBeUndefined()
  })

  it('keeps a single active photo type', () => {
    expect(photoTypesFilter(['flat'])).toEqual(['flat'])
    expect(photoTypesFilter(['pano'])).toEqual(['pano'])
  })
})

describe('photoMatchesFilters', () => {
  it('filters photos by type and capturedAt range', () => {
    expect(photoMatchesPhotoTypes(photo({ isPano: true }), ['flat'])).toBe(false)
    expect(photoMatchesPhotoTypes(photo({ isPano: false }), ['flat'])).toBe(true)

    expect(
      photoMatchesDateRange(photo({ capturedAt: Date.UTC(2024, 0, 15) }), {
        from: '2024-01-01',
        to: '2024-12-31',
      }),
    ).toBe(true)

    expect(
      photoMatchesDateRange(photo({ capturedAt: Date.UTC(2023, 11, 31) }), {
        from: '2024-01-01',
      }),
    ).toBe(false)

    expect(
      photoMatchesFilters(photo({ isPano: true, capturedAt: Date.UTC(2024, 5, 1) }), ['pano'], {
        from: '2024-01-01',
        to: '2024-12-31',
      }),
    ).toBe(true)
  })
})

describe('mapFeatureMatchesDateRange', () => {
  it('uses iD semantics: last_seen_at >= from and first_seen_at <= to', () => {
    expect(
      mapFeatureMatchesDateRange(mapFeature(), {
        from: '2024-01-01',
        to: '2025-12-31',
      }),
    ).toBe(true)

    expect(
      mapFeatureMatchesDateRange(mapFeature({ lastSeenAt: Date.UTC(2023, 0, 1) }), {
        from: '2024-01-01',
      }),
    ).toBe(false)

    expect(
      mapFeatureMatchesDateRange(mapFeature({ firstSeenAt: Date.UTC(2026, 0, 1) }), {
        to: '2025-12-31',
      }),
    ).toBe(false)
  })
})
