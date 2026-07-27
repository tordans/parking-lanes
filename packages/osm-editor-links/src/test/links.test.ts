import { describe, expect, test } from 'bun:test'
import {
  idEditorUrl,
  mapillaryRecentPanosUrl,
  mapillaryUrl,
  osmDevUrl,
  osmProdApiUrl,
  osmProdUrl,
} from '../index'

describe('editor links', () => {
  test('exports OSM website and API URLs', () => {
    expect(osmProdUrl).toBe('https://www.openstreetmap.org')
    expect(osmProdApiUrl).toBe('https://api.openstreetmap.org')
    expect(osmDevUrl).toBe('https://master.apis.dev.openstreetmap.org')
  })

  test('idEditorUrl builds hash params for selected object', () => {
    const url = idEditorUrl({
      center: { lat: 52.5, lng: 13.4 },
      zoom: 18,
      osmObjectType: 'way',
      osmObjectId: 42,
    })

    expect(url).toContain('#')
    expect(url).toContain('id=w42')
    expect(url).toContain('map=18%2F52.5%2F13.4')
  })

  test('mapillaryUrl builds unfiltered viewport link', () => {
    const url = mapillaryUrl({ lat: 52.52, lng: 13.405 })

    expect(url).toBe(
      'https://www.mapillary.com/app/?lat=52.52&lng=13.405&z=17&focus=map&trafficSign=all',
    )
  })

  test('mapillaryRecentPanosUrl adds 3-year date filter and panos=true', () => {
    const url = mapillaryRecentPanosUrl(
      { lat: 52.52, lng: 13.405 },
      { referenceDate: new Date('2026-07-27T12:00:00.000Z') },
    )

    expect(url).toBe(
      'https://www.mapillary.com/app/?lat=52.52&lng=13.405&z=17&focus=map&trafficSign=all&dateFrom=2023-07-27&dateTo=2026-07-27&panos=true',
    )
  })
})
