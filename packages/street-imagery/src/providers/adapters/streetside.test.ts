import { describe, expect, it } from 'bun:test'
import { normalizeStreetsideBubble, parseStreetsideDate, type StreetsideBubble } from './streetside'

const seattleFixture: StreetsideBubble = {
  imageUrl:
    'https://ecn.{subdomain}.tiles.virtualearth.net/tiles/hs1032000332102312{faceId}{tileId}?g=15580&key=test',
  imageUrlSubdomains: ['t0', 't1', 't2', 't3'],
  vintageEnd: '24 Mar 2019 GMT',
  he: 142.48,
  lat: 47.609941,
  lon: -122.340087,
}

const longitudeFallbackFixture: StreetsideBubble = {
  id: 'bubble-stable-id',
  imageUrl: 'https://example.com/bubble',
  vintageEnd: '15 Jan 2020 GMT',
  heading: 90,
  latitude: 48.8566,
  longitude: 2.3522,
}

describe('parseStreetsideDate', () => {
  it('parses vintageEnd timestamps', () => {
    expect(parseStreetsideDate('24 Mar 2019 GMT')).toBe(Date.parse('24 Mar 2019 GMT'))
  })

  it('returns null for invalid values', () => {
    expect(parseStreetsideDate('')).toBeNull()
    expect(parseStreetsideDate(undefined)).toBeNull()
  })
})

describe('normalizeStreetsideBubble', () => {
  it('maps Seattle API bubble to normalized photo', () => {
    expect(normalizeStreetsideBubble(seattleFixture)).toEqual({
      photoId: seattleFixture.imageUrl,
      sequenceId: null,
      capturedAt: Date.parse('24 Mar 2019 GMT'),
      isPano: true,
      heading: 142.48,
      lngLat: [-122.340087, 47.609941],
      thumbUrl: seattleFixture.imageUrl,
      streetside: {
        urlTemplate: seattleFixture.imageUrl,
        subdomains: ['t0', 't1', 't2', 't3'],
      },
    })
  })

  it('prefers id over imageUrl and supports longitude/latitude fallbacks', () => {
    expect(normalizeStreetsideBubble(longitudeFallbackFixture)).toEqual({
      photoId: 'bubble-stable-id',
      sequenceId: null,
      capturedAt: Date.parse('15 Jan 2020 GMT'),
      isPano: true,
      heading: 90,
      lngLat: [2.3522, 48.8566],
      thumbUrl: longitudeFallbackFixture.imageUrl,
      streetside: {
        urlTemplate: longitudeFallbackFixture.imageUrl,
        subdomains: ['t0', 't1', 't2', 't3'],
      },
    })
  })

  it('returns null when coordinates are missing', () => {
    expect(normalizeStreetsideBubble({ imageUrl: 'x' })).toBeNull()
  })
})
