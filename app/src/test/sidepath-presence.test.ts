import { describe, expect, test } from 'bun:test'
import { resolveSidepathPresence } from '../modes/lanes/domain/sidepath-presence'

describe('resolveSidepathPresence', () => {
  test('treats unsided sidewalk as known and writable on the bare key', () => {
    const presence = resolveSidepathPresence(
      { highway: 'residential', sidewalk: 'both' },
      'sidewalk',
    )
    expect(presence.isUnknown).toBe(false)
    expect(presence.schema).toBe('unsided')
    expect(presence.writeKey).toBe('sidewalk')
    expect(presence.value).toBe('both')
  })

  test('reads sided sidewalk tags and does not claim unknown', () => {
    const presence = resolveSidepathPresence(
      {
        highway: 'residential',
        'sidewalk:left': 'yes',
        'cycleway:left': 'lane',
      },
      'sidewalk',
    )
    expect(presence.isUnknown).toBe(false)
    expect(presence.schema).toBe('sided')
    expect(presence.left).toBe('yes')
    expect(presence.right).toBeUndefined()
    expect(presence.writeKey).toBe('sidewalk:left')
  })

  test('reads sided cycleway presence for the matrix-matching case', () => {
    const presence = resolveSidepathPresence(
      {
        highway: 'residential',
        'sidewalk:left': 'yes',
        'cycleway:left': 'lane',
      },
      'cycleway',
    )
    expect(presence.isUnknown).toBe(false)
    expect(presence.schema).toBe('sided')
    expect(presence.left).toBe('lane')
  })

  test('is unknown only when no presence tag exists on either side', () => {
    const presence = resolveSidepathPresence({ highway: 'residential', lanes: '2' }, 'sidewalk')
    expect(presence.isUnknown).toBe(true)
    expect(presence.schema).toBe('none')
    expect(presence.writeKey).toBe('sidewalk')
  })

  test('prefers sidewalk:both over inventing an unsided key', () => {
    const presence = resolveSidepathPresence(
      { highway: 'residential', 'sidewalk:both': 'separate' },
      'sidewalk',
    )
    expect(presence.isUnknown).toBe(false)
    expect(presence.schema).toBe('both')
    expect(presence.writeKey).toBe('sidewalk:both')
    expect(presence.value).toBe('separate')
  })
})
