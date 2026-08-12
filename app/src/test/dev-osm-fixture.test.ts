import { describe, expect, test } from 'bun:test'
import { devOsmMapFixtureMapUrl } from '@osm-editor-kit/osm-coverage/dev-osm-map-fixture'
import {
  DEV_OSM_FIXTURE_TEST_STREET_WAY_ID,
  sanitizeDevOsmFixtureTestStreet,
} from '../modes/parking/fixtures/dev-map-fixture.const'
import { isDevOsmFixtureActive } from '../shell/dev-osm-fixture-store'

describe('dev OSM fixture gate', () => {
  test('isDevOsmFixtureActive requires Vite DEV === true', () => {
    // Bun test does not set Vite's import.meta.env.DEV to true.
    expect(import.meta.env.DEV === true).toBe(false)
    expect(isDevOsmFixtureActive()).toBe(false)
  })
})

describe('devOsmMapFixtureMapUrl', () => {
  test('builds a local Map API slice URL under the app base path', () => {
    expect(
      devOsmMapFixtureMapUrl('/street-space-editor/', {
        west: 13.4,
        south: 52.45,
        east: 13.45,
        north: 52.48,
      }),
    ).toBe('/street-space-editor/dev-osm-map-fixture/api/0.6/map?bbox=13.4,52.45,13.45,52.48')
  })
})

describe('sanitizeDevOsmFixtureTestStreet', () => {
  test('keeps only highway and name on the Bartastraße test way', () => {
    const elements = sanitizeDevOsmFixtureTestStreet([
      {
        type: 'way',
        id: DEV_OSM_FIXTURE_TEST_STREET_WAY_ID,
        tags: {
          highway: 'residential',
          name: 'Bartastraße',
          'parking:both': 'lane',
          width: '10',
        },
      },
      { type: 'way', id: 1, tags: { highway: 'primary', surface: 'asphalt' } },
    ])

    expect(elements[0]!.tags).toEqual({ highway: 'residential', name: 'Bartastraße' })
    expect(elements[1]!.tags).toEqual({ highway: 'primary', surface: 'asphalt' })
  })
})
