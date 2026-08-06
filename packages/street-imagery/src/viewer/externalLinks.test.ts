import { beforeAll, describe, expect, it } from 'bun:test'
import { createStreetImageryConfig, setStreetImageryConfig } from '../config'
import type { NormalizedPhoto } from '../providers/model'
import { providerExternalLink, providerLocationLink } from './externalLinks'

beforeAll(() => {
  setStreetImageryConfig(
    createStreetImageryConfig({
      mapillaryToken: 'test-token',
    }),
  )
})

const streetViewPhoto: NormalizedPhoto = {
  providerId: 'streetview',
  photoId: 'pano-abc123',
  sequenceId: null,
  capturedAt: Date.parse('2021-08-01'),
  isPano: true,
  heading: null,
  lngLat: [-122.0838, 37.421755],
}

describe('providerExternalLink', () => {
  it('builds a Google Maps panorama deep link from the photo viewpoint', () => {
    expect(providerExternalLink(streetViewPhoto)).toBe(
      'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=37.421755,-122.0838',
    )
  })
})

describe('providerLocationLink', () => {
  const lat = 52.52
  const lng = 13.405
  const zoom = 16

  it('builds a Google Street View panorama link at the map center', () => {
    expect(providerLocationLink('streetview', lat, lng, zoom)).toBe(
      'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=52.52,13.405',
    )
  })

  it('builds a Mapillary map link at the map center', () => {
    expect(providerLocationLink('mapillary', lat, lng, zoom)).toBe(
      'https://www.mapillary.com/app/?lat=52.52&lng=13.405&z=17&focus=map',
    )
  })

  it('builds a Panoramax map link with the current zoom', () => {
    expect(providerLocationLink('panoramax', lat, lng, zoom)).toBe(
      'https://api.panoramax.xyz/?focus=map&map=16/52.52/13.405',
    )
  })

  it('builds a KartaView map link with the current zoom', () => {
    expect(providerLocationLink('kartaview', lat, lng, zoom)).toBe(
      'https://kartaview.org/map/@52.52,13.405,16z',
    )
  })

  it('builds an Apple Look Around link at the map center', () => {
    const url = providerLocationLink('lookaround', lat, lng, zoom)
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe('https://maps.apple.com/look-around')
    expect(parsed.searchParams.get('coordinate')).toBe('52.52,13.405')
    expect(parsed.searchParams.get('_mvs')).toBeTruthy()
  })
})
