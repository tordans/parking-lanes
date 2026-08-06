import { describe, expect, it } from 'bun:test'
import type { Feature } from 'geojson'
import { normalizeMapillaryTrafficSignFeature } from './mapillary-signs'

describe('normalizeMapillaryTrafficSignFeature', () => {
  it('maps MVT traffic_sign properties to normalized map features', () => {
    const feature: Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [13.4, 52.5] },
      properties: {
        id: 610211624184438,
        first_seen_at: 1_666_364_950_000,
        last_seen_at: 1_782_898_918_080,
        value: 'regulatory--no-stopping--g1',
      },
    }

    expect(normalizeMapillaryTrafficSignFeature(feature)).toEqual({
      featureId: '610211624184438',
      value: 'regulatory--no-stopping--g1',
      firstSeenAt: 1_666_364_950_000,
      lastSeenAt: 1_782_898_918_080,
      lngLat: [13.4, 52.5],
    })
  })
})
