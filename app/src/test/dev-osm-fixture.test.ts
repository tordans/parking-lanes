import { describe, expect, test } from 'bun:test'
import { isDevOsmFixtureActive } from '../shell/dev-osm-fixture-store'

describe('dev OSM fixture gate', () => {
  test('isDevOsmFixtureActive requires Vite DEV === true', () => {
    // Bun test does not set Vite's import.meta.env.DEV to true.
    expect(import.meta.env.DEV === true).toBe(false)
    expect(isDevOsmFixtureActive()).toBe(false)
  })
})
