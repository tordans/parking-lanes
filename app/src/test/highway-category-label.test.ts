import { describe, expect, test } from 'bun:test'
import { highwayCategoryLabel } from '../utils/highway-category-label'

describe('highwayCategoryLabel', () => {
  test('returns English labels for common street categories', () => {
    expect(highwayCategoryLabel('residential')).toBe('Residential road')
    expect(highwayCategoryLabel('living_street')).toBe('Living street')
    expect(highwayCategoryLabel('primary')).toBe('Primary road')
  })

  test('humanizes unknown highway values', () => {
    expect(highwayCategoryLabel('construction')).toBe('Construction')
  })

  test('returns null without highway tag', () => {
    expect(highwayCategoryLabel(undefined)).toBeNull()
  })
})
