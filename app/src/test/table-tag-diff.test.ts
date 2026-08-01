import { describe, expect, test } from 'bun:test'
import { suggestPropagateFromCenter } from '../modes/table/domain/suggestions'
import { buildTagRows } from '../modes/table/domain/tag-diff'

function makeSegment(id: number, tags: Record<string, string>) {
  return { id, tags }
}

describe('buildTagRows', () => {
  const chain = {
    segments: [
      makeSegment(1, { highway: 'primary', surface: 'asphalt' }),
      makeSegment(2, { highway: 'primary', width: '3' }),
      makeSegment(3, { highway: 'primary', surface: 'paving_stones' }),
    ],
    centerIndex: 1,
  }

  test('classifies unchanged, changed, added, removed, missing', () => {
    const rows = buildTagRows(chain)
    const highway = rows.find((r) => r.key === 'highway')
    expect(highway?.cells.every((c) => c.status === 'unchanged')).toBe(true)

    const surface = rows.find((r) => r.key === 'surface')
    expect(surface?.cells[0]?.status).toBe('added')
    expect(surface?.cells[1]?.status).toBe('missing')
    expect(surface?.cells[2]?.status).toBe('added')

    const width = rows.find((r) => r.key === 'width')
    expect(width?.cells[1]?.status).toBe('unchanged')
    expect(width?.cells[0]?.status).toBe('removed')
    expect(width?.cells[2]?.status).toBe('removed')
  })

  test('sorts keys alphabetically', () => {
    const rows = buildTagRows(chain)
    const keys = rows.map((r) => r.key)
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)))
  })
})

describe('suggestPropagateFromCenter', () => {
  test('suggests propagating differing center values', () => {
    const segments = [
      makeSegment(1, { highway: 'primary', surface: 'asphalt' }),
      makeSegment(2, { highway: 'primary', surface: 'concrete' }),
      makeSegment(3, { highway: 'residential', surface: 'asphalt' }),
    ]
    const rows = buildTagRows({ segments, centerIndex: 1 })
    const suggestions = suggestPropagateFromCenter(segments, 1, rows)

    const surface = suggestions.find((s) => s.key === 'surface')
    expect(surface?.value).toBe('concrete')
    expect(surface?.affectedWayIds).toEqual([1, 3])

    const highway = suggestions.find((s) => s.key === 'highway')
    expect(highway?.value).toBe('primary')
    expect(highway?.affectedWayIds).toEqual([3])
  })

  test('skips keys missing on center', () => {
    const segments = [
      makeSegment(1, { surface: 'asphalt' }),
      makeSegment(2, { highway: 'primary' }),
      makeSegment(3, { surface: 'asphalt' }),
    ]
    const rows = buildTagRows({ segments, centerIndex: 1 })
    const suggestions = suggestPropagateFromCenter(segments, 1, rows)
    expect(suggestions.some((s) => s.key === 'surface')).toBe(false)
  })
})
