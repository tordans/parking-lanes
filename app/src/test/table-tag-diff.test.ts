import { describe, expect, test } from 'bun:test'
import { suggestPropagateFromCenter } from '../modes/table/domain/suggestions'
import { buildTagGroups, buildTagRows, partitionTagRows } from '../modes/table/domain/tag-diff'
import { classifyTagKey } from '../modes/table/domain/tag-groups'
import { formatTableTagKeyLabel } from '../modes/table/domain/tag-key-label'

function makeSegment(id: number, tags: Record<string, string>) {
  return { id, tags }
}

describe('classifyTagKey', () => {
  test('maps cycleway and sidewalk sided keys', () => {
    expect(classifyTagKey('cycleway:left')).toBe('bikelane_left')
    expect(classifyTagKey('cycleway:right:width')).toBe('bikelane_right')
    expect(classifyTagKey('source:cycleway:left:width')).toBe('bikelane_left')
    expect(classifyTagKey('sidewalk:left:surface')).toBe('sidewalk_left')
    expect(classifyTagKey('note:sidewalk:right')).toBe('sidewalk_right')
  })

  test('puts bare/:both cycleway and bicycle access in the cycleway group', () => {
    expect(classifyTagKey('cycleway')).toBe('bikelane')
    expect(classifyTagKey('cycleway:both')).toBe('bikelane')
    expect(classifyTagKey('cycleway:both:width')).toBe('bikelane')
    expect(classifyTagKey('source:cycleway:both:width')).toBe('bikelane')
    expect(classifyTagKey('bicycle')).toBe('bikelane')
    expect(classifyTagKey('bicycle:forward')).toBe('bikelane')
  })

  test('puts bare/:both sidewalk and foot access in the footway group', () => {
    expect(classifyTagKey('sidewalk')).toBe('sidewalk')
    expect(classifyTagKey('sidewalk:both')).toBe('sidewalk')
    expect(classifyTagKey('sidewalk:both:surface')).toBe('sidewalk')
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
  test('strips parking side nesting like the parking editor', () => {
    expect(formatTableTagKeyLabel('parking:both', 'centerline')).toBe('both')
    expect(formatTableTagKeyLabel('parking:both:fee', 'centerline')).toBe('fee')
    expect(formatTableTagKeyLabel('parking:both:fee:conditional', 'centerline')).toBe(
      'fee:conditional',
    )
    expect(formatTableTagKeyLabel('parking:right:restriction:conditional', 'centerline')).toBe(
      'restri…:conditional',
    )
  })

  test('strips sidepath prefixes already shown by the group heading', () => {
    expect(formatTableTagKeyLabel('cycleway:left', 'bikelane_left')).toBe('left')
    expect(formatTableTagKeyLabel('cycleway:left:width', 'bikelane_left')).toBe('width')
    expect(formatTableTagKeyLabel('source:cycleway:right:width', 'bikelane_right')).toBe(
      'source:width',
    )
    expect(formatTableTagKeyLabel('sidewalk:right:surface', 'sidewalk_right')).toBe('surface')
    expect(formatTableTagKeyLabel('cycleway:both', 'bikelane')).toBe('both')
    expect(formatTableTagKeyLabel('bicycle:forward', 'bikelane')).toBe('forward')
    expect(formatTableTagKeyLabel('foot', 'sidewalk')).toBe('foot')
    expect(formatTableTagKeyLabel('sidewalk:both:surface', 'sidewalk')).toBe('both:surface')
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

    expect(groups.map((g) => g.id)).toEqual([
      'centerline',
      'bikelane',
      'bikelane_left',
      'sidewalk',
      'sidewalk_right',
    ])
    expect(groups.find((g) => g.id === 'centerline')?.rows.map((r) => r.key)).toEqual([
      'highway',
      'oneway',
      'oneway:bicycle',
    ])
    expect(groups.find((g) => g.id === 'bikelane')?.rows.map((r) => r.key)).toEqual([
      'bicycle',
      'cycleway:both',
    ])
    expect(groups.find((g) => g.id === 'bikelane_left')?.rows.map((r) => r.key)).toEqual([
      'cycleway:left',
    ])
    expect(groups.find((g) => g.id === 'sidewalk')?.rows.map((r) => r.key)).toEqual(['foot'])
    expect(groups.find((g) => g.id === 'sidewalk_right')?.rows.map((r) => r.key)).toEqual([
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
