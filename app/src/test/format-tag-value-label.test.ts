import { describe, expect, test } from 'bun:test'
import { formatParkingTagValueLabel } from '../modes/parking/domain/editor/format-tag-value-label'

describe('formatParkingTagValueLabel', () => {
  test('returns German gloss with OSM value for known values', () => {
    expect(formatParkingTagValueLabel('parallel')).toBe('Parallel zur Straße (parallel)')
    expect(formatParkingTagValueLabel('street_side')).toBe(
      'Parkbuchten (nur 1-2 Parkstände) (street_side)',
    )
  })

  test('falls back to raw OSM value for unknown values', () => {
    expect(formatParkingTagValueLabel('bus_lane')).toBe('bus_lane')
  })

  test('returns empty string for empty value', () => {
    expect(formatParkingTagValueLabel('')).toBe('')
  })
})
