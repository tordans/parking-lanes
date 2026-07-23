import { parseLeafletHash, parseMapParam, serializeMapParam } from '../utils/map-param'

describe('map param', () => {
  test('parseMapParam accepts zoom/lat/lng', () => {
    expect(parseMapParam('16/52.4751/13.4435')).toEqual({
      zoom: 16,
      lat: 52.4751,
      lng: 13.4435,
    })
  })

  test('parseMapParam rejects invalid values', () => {
    expect(parseMapParam('invalid')).toBeNull()
    expect(parseMapParam('99/0/0')).toBeNull()
    expect(parseMapParam('16/91/0')).toBeNull()
  })

  test('parseLeafletHash strips leading hash', () => {
    expect(parseLeafletHash('#16/52.4751/13.4435')).toEqual({
      zoom: 16,
      lat: 52.4751,
      lng: 13.4435,
    })
  })

  test('parseLeafletHash rejects empty or invalid hash', () => {
    expect(parseLeafletHash('#')).toBeNull()
    expect(parseLeafletHash('')).toBeNull()
    expect(parseLeafletHash('#foo')).toBeNull()
  })

  test('serializeMapParam rounds coordinates', () => {
    expect(serializeMapParam({ zoom: 16.12, lat: 52.47512, lng: 13.44356 })).toBe(
      '16.1/52.4751/13.4436',
    )
  })
})
