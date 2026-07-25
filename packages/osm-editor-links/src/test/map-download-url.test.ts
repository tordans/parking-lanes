import { describe, expect, test } from 'bun:test'
import type { MapBounds } from '@osm-editor-kit/osm-data'
import { getUrl } from '../map-download-url'

describe('getUrl', () => {
  const bounds: MapBounds = { west: 13.3, south: 52.4, east: 13.5, north: 52.6 }

  test('builds production map download URL', () => {
    expect(getUrl(bounds, false)).toBe(
      'https://api.openstreetmap.org/api/0.6/map?bbox=13.3,52.4,13.5,52.6',
    )
  })

  test('builds dev map download URL', () => {
    expect(getUrl(bounds, true)).toBe(
      'https://master.apis.dev.openstreetmap.org/api/0.6/map?bbox=13.3,52.4,13.5,52.6',
    )
  })
})
