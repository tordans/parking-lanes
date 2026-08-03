import { describe, expect, test } from 'bun:test'
import { suggestPropagateFromCenter } from '../modes/table/domain/suggestions'
import { buildTagGroups, buildTagRows, partitionTagRows } from '../modes/table/domain/tag-diff'
import { classifyTagKey } from '../modes/table/domain/tag-groups'
import { compactTagKeyLabel, formatTableTagKeyLabel } from '../modes/table/domain/tag-key-label'

function makeSegment(id: number, tags: Record<string, string>) {
  return { id, tags }
}

describe('classifyTagKey', () => {
  test('puts all cycleway sides and bicycle access in one cycleway group', () => {
    expect(classifyTagKey('cycleway:left')).toBe('bikelane')
    expect(classifyTagKey('cycleway:right:width')).toBe('bikelane')
    expect(classifyTagKey('source:cycleway:left:width')).toBe('bikelane')
    expect(classifyTagKey('cycleway')).toBe('bikelane')
    expect(classifyTagKey('cycleway:both')).toBe('bikelane')
    expect(classifyTagKey('bicycle')).toBe('bikelane')
    expect(classifyTagKey('bicycle:forward')).toBe('bikelane')
  })

  test('puts all sidewalk sides and foot access in one footway group', () => {
    expect(classifyTagKey('sidewalk:left:surface')).toBe('sidewalk')
    expect(classifyTagKey('note:sidewalk:right')).toBe('sidewalk')
    expect(classifyTagKey('sidewalk')).toBe('sidewalk')
    expect(classifyTagKey('sidewalk:both')).toBe('sidewalk')
    expect(classifyTagKey('foot')).toBe('sidewalk')
    expect(classifyTagKey('foot:conditional')).toBe('sidewalk')
  })

  test('keeps highway and oneway (+ oneway:bicycle) on centerline together', () => {
    expect(classifyTagKey('highway')).toBe('centerline')
    expect(classifyTagKey('surface')).toBe('centerline')
    expect(classifyTagKey('oneway')).toBe('centerline')
    expect(classifyTagKey('oneway:bicycle')).toBe('centerline')
  })
})

describe('formatTableTagKeyLabel', () => {
  test('keeps readable OSM keys and shortens the head when narrow', () => {
    expect(formatTableTagKeyLabel('cycleway:left')).toBe('cycleway:left')
    expect(formatTableTagKeyLabel('cycleway:left:width')).toBe('cycleway:left:width')
    expect(formatTableTagKeyLabel('bicycle:forward')).toBe('bicycle:forward')
    expect(formatTableTagKeyLabel('cycleway:left', 10)).toBe('cy…:left')
    expect(compactTagKeyLabel('cycleway:left:width', 14)).toBe('cy…:left:width')
  })

  test('still compacts very long :conditional labels', () => {
    expect(formatTableTagKeyLabel('parking:right:restriction:conditional')).toBe(
      'parkin…:conditional',
    )
  })
})

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

describe('buildTagGroups', () => {
  test('partitions keys into disclosure groups in order', () => {
    const groups = buildTagGroups({
      segments: [
        makeSegment(1, {
          highway: 'residential',
          oneway: 'yes',
          'oneway:bicycle': 'no',
          bicycle: 'yes',
          'cycleway:both': 'lane',
          'cycleway:left': 'lane',
          foot: 'yes',
          'sidewalk:right:surface': 'paving_stones',
        }),
      ],
      centerIndex: 0,
    })

    expect(groups.map((g) => g.id)).toEqual(['centerline', 'bikelane', 'sidewalk'])
    expect(groups.find((g) => g.id === 'centerline')?.rows.map((r) => r.key)).toEqual([
      'highway',
      'oneway',
      'oneway:bicycle',
    ])
    expect(groups.find((g) => g.id === 'bikelane')?.rows.map((r) => r.key)).toEqual([
      'bicycle',
      'cycleway:both',
      'cycleway:left',
    ])
    expect(groups.find((g) => g.id === 'sidewalk')?.rows.map((r) => r.key)).toEqual([
      'foot',
      'sidewalk:right:surface',
    ])
  })

  test('partitionTagRows matches buildTagGroups without rebuilding rows', () => {
    const chain = {
      segments: [
        makeSegment(1, {
          highway: 'residential',
          'cycleway:left': 'lane',
          'sidewalk:right:surface': 'paving_stones',
        }),
      ],
      centerIndex: 0,
    }
    const rows = buildTagRows(chain)
    expect(partitionTagRows(rows)).toEqual(buildTagGroups(chain))
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
