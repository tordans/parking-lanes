import { describe, expect, test } from 'bun:test'
import { widthMeasureGuideKind } from '../modes/width/domain/width-measure-guide-kind'
import { expandedSectionId, sectionsForPanel } from '../modes/width/measure-guide/sections'

describe('widthMeasureGuideKind', () => {
  test('maps sidepath prefixes', () => {
    expect(widthMeasureGuideKind({ prefix: 'sidewalk', tags: { highway: 'residential' } })).toBe(
      'sidewalk',
    )
    expect(widthMeasureGuideKind({ prefix: 'cycleway', tags: { highway: 'residential' } })).toBe(
      'cycleway',
    )
  })

  test('maps centerline highway types', () => {
    expect(widthMeasureGuideKind({ tags: { highway: 'residential' } })).toBe('road')
    expect(widthMeasureGuideKind({ tags: { highway: 'cycleway' } })).toBe('cycleway')
    expect(widthMeasureGuideKind({ tags: { highway: 'footway' } })).toBe('sidewalk')
    expect(widthMeasureGuideKind({ tags: { highway: 'pedestrian' } })).toBe('sidewalk')
    expect(widthMeasureGuideKind({ tags: { highway: 'track' } })).toBe('other')
  })

  test('maps path by access tags', () => {
    expect(widthMeasureGuideKind({ tags: { highway: 'path', bicycle: 'designated' } })).toBe(
      'cycleway',
    )
    expect(widthMeasureGuideKind({ tags: { highway: 'path', foot: 'designated' } })).toBe(
      'sidewalk',
    )
    expect(widthMeasureGuideKind({ tags: { highway: 'path' } })).toBe('sidewalk')
  })
})

describe('sectionsForPanel', () => {
  test('road baseline sections without gated tags', () => {
    const ids = sectionsForPanel('road', { highway: 'residential' }).map((s) => s.id)
    expect(ids).toContain('road_kerb')
    expect(ids).toContain('road_width_lanes')
    expect(ids).toContain('maxwidth_vs_width')
    expect(ids).toContain('narrowings')
    expect(ids).toContain('est_width_provenance')
    expect(ids).not.toContain('road_parking_branch')
    expect(ids).not.toContain('road_width_vs_lanes')
    expect(ids).not.toContain('row_composition')
    expect(expandedSectionId(sectionsForPanel('road', { highway: 'residential' }))).toBe(
      'road_kerb',
    )
  })

  test('road showWhen gates parking and width:lanes', () => {
    const withParking = sectionsForPanel('road', {
      highway: 'residential',
      'parking:right': 'lane',
    }).map((s) => s.id)
    expect(withParking).toContain('road_parking_branch')
    expect(expandedSectionId(sectionsForPanel('road', { 'parking:right': 'lane' }))).toBe(
      'road_parking_branch',
    )

    const withLanes = sectionsForPanel('road', {
      highway: 'residential',
      'width:lanes': '3|3',
      'parking:right': 'lane',
    }).map((s) => s.id)
    expect(withLanes).toContain('road_width_vs_lanes')
    expect(withLanes).toContain('road_parking_branch')
    expect(
      expandedSectionId(
        sectionsForPanel('road', {
          'width:lanes': '3|3',
          'parking:right': 'lane',
        }),
      ),
    ).toBe('road_width_vs_lanes')
  })

  test('cycleway baseline and gated buffer / segregated', () => {
    const base = sectionsForPanel('cycleway', { highway: 'cycleway' }).map((s) => s.id)
    expect(base).toContain('cycleway_clear')
    expect(base).toContain('est_width_provenance')
    expect(base).not.toContain('cycleway_buffer')
    expect(base).not.toContain('path_segregated')
    expect(base).not.toContain('narrowings')

    const withBuffer = sectionsForPanel('cycleway', {
      highway: 'cycleway',
      'cycleway:right:buffer': '1.0',
    }).map((s) => s.id)
    expect(withBuffer).toContain('cycleway_buffer')
    expect(
      expandedSectionId(sectionsForPanel('cycleway', { 'cycleway:right:buffer': '1.0' })),
    ).toBe('cycleway_buffer')

    const segregated = sectionsForPanel('cycleway', {
      highway: 'path',
      bicycle: 'designated',
      segregated: 'yes',
    }).map((s) => s.id)
    expect(segregated).toContain('path_segregated')

    const footCycleWidths = sectionsForPanel('cycleway', {
      highway: 'path',
      'cycleway:width': '1.3',
      'footway:width': '2.2',
    }).map((s) => s.id)
    expect(footCycleWidths).toContain('path_segregated')
    expect(
      expandedSectionId(
        sectionsForPanel('cycleway', {
          'cycleway:width': '1.3',
          'footway:width': '2.2',
        }),
      ),
    ).toBe('path_segregated')
  })

  test('sidewalk and other kinds', () => {
    const sidewalk = sectionsForPanel('sidewalk', { highway: 'footway' }).map((s) => s.id)
    expect(sidewalk).toEqual(
      expect.arrayContaining(['sidewalk', 'verge', 'narrowings', 'est_width_provenance']),
    )
    expect(sidewalk).not.toContain('road_kerb')
    expect(expandedSectionId(sectionsForPanel('sidewalk', {}))).toBe('sidewalk')

    const other = sectionsForPanel('other', { highway: 'track' }).map((s) => s.id)
    expect(other).toEqual(
      expect.arrayContaining(['other_path', 'narrowings', 'est_width_provenance']),
    )
    expect(expandedSectionId(sectionsForPanel('other', {}))).toBe('other_path')
  })
})
