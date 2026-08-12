import { describe, expect, it } from 'bun:test'
import type { Feature } from 'geojson'
import {
  normalizePanoramaxPictureFeature,
  normalizePanoramaxSequenceFeature,
  parsePanoramaxTimestamp,
} from './panoramax'

describe('parsePanoramaxTimestamp', () => {
  it('parses ISO timestamps to epoch milliseconds', () => {
    expect(parsePanoramaxTimestamp('2024-06-01T12:00:00.000Z')).toBe(
      Date.parse('2024-06-01T12:00:00.000Z'),
    )
  })

  it('returns null for invalid values', () => {
    expect(parsePanoramaxTimestamp('')).toBeNull()
    expect(parsePanoramaxTimestamp(undefined)).toBeNull()
  })
})

describe('normalizePanoramaxPictureFeature', () => {
  it('maps MVT picture properties to normalized photos', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: {
        id: 'pic-1',
        first_sequence: 'collection-9',
        ts: '2024-06-01T12:00:00.000Z',
        heading: '180',
        type: 'equirectangular',
      },
    }

    expect(normalizePanoramaxPictureFeature(feature)).toEqual({
      photoId: 'pic-1',
      sequenceId: 'collection-9',
      capturedAt: Date.parse('2024-06-01T12:00:00.000Z'),
      isPano: true,
      heading: 180,
      lngLat: [2.35, 48.85],
    })
  })

  it('treats non-equirectangular types as flat photos', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [2.35, 48.85] },
      properties: {
        id: 'pic-2',
        type: 'flat',
      },
    }

    expect(normalizePanoramaxPictureFeature(feature)?.isPano).toBe(false)
  })
})

describe('normalizePanoramaxSequenceFeature', () => {
  it('maps sequence line features', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [2.35, 48.85],
            [2.36, 48.86],
          ],
        ],
      },
      properties: { id: 'seq-22' },
    }

    expect(normalizePanoramaxSequenceFeature(feature)).toEqual({
      sequenceId: 'seq-22',
      geometry: feature.geometry,
      capturedAt: null,
      isPano: null,
    })
  })
})
