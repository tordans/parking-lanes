import { describe, expect, test } from 'bun:test'
import { createImageryUsageSession, formatImageryUsedTag } from '../imagery-usage'

describe('createImageryUsageSession', () => {
  test('deduplicates and sorts recorded imagery', () => {
    const session = createImageryUsageSession()
    session.record('Geoportal Berlin / Luftbilder 2024')
    session.record('OpenFreeMap Positron')
    session.record('Geoportal Berlin / Luftbilder 2024')

    expect(session.values()).toEqual(['Geoportal Berlin / Luftbilder 2024', 'OpenFreeMap Positron'])
  })
})

describe('formatImageryUsedTag', () => {
  test('joins unique values with semicolons', () => {
    expect(
      formatImageryUsedTag(['ALKIS Berlin', 'Geoportal Berlin / Digitale farbige Orthophotos']),
    ).toBe('ALKIS Berlin; Geoportal Berlin / Digitale farbige Orthophotos')
  })
})
