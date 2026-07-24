import { parseLegacyMapHash, parseMapParam, serializeMapParam } from '../map-param'

describe('map param', () => {
  test('parseMapParam accepts zoom/lat/lng', () => {
    expect(parseMapParam('16/52.4751/13.4435')).toEqual({
      zoom: 16,
      lat: 52.4751,
      lng: 13.4435,
    })
  })

  test('parseMapParam accepts zoom/lat/lng/bearing', () => {
    expect(parseMapParam('16/52.4751/13.4435/45')).toEqual({
      zoom: 16,
      lat: 52.4751,
      lng: 13.4435,
      bearing: 45,
    })
  })

  test('parseMapParam rejects invalid values', () => {
    expect(parseMapParam('invalid')).toBeNull()
    expect(parseMapParam('99/0/0')).toBeNull()
    expect(parseMapParam('16/91/0')).toBeNull()
  })

  test('parseLegacyMapHash reads #map=zoom/lat/lng', () => {
    expect(parseLegacyMapHash('#map=16/52.4751/13.4435')).toEqual({
      zoom: 16,
      lat: 52.4751,
      lng: 13.4435,
    })
  })

  test('parseLegacyMapHash rejects bare hash without map= prefix', () => {
    expect(parseLegacyMapHash('#16/52.4751/13.4435')).toBeNull()
    expect(parseLegacyMapHash('#')).toBeNull()
    expect(parseLegacyMapHash('')).toBeNull()
    expect(parseLegacyMapHash('#foo')).toBeNull()
  })

  test('serializeMapParam rounds coordinates', () => {
    expect(serializeMapParam({ zoom: 16.12, lat: 52.47512, lng: 13.44356 })).toBe(
      '16.1/52.4751/13.4436',
    )
  })

  test('serializeMapParam appends bearing as 4th segment', () => {
    expect(serializeMapParam({ zoom: 16, lat: 52.4751, lng: 13.4435, bearing: 45.12 })).toBe(
      '16/52.4751/13.4435/45.1',
    )
  })
})
