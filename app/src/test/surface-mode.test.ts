import { describe, expect, mock, test } from 'bun:test'
import { settLengthForSize } from '@osm-editor-kit/osm-surface-quality'
import {
  isSmoothnessValidForSurface,
  settSizeChangePatch,
  smoothnessChangePatch,
  surfaceChangePatch,
} from '../modes/surface/domain/surface-tag-patches'

describe('surface tag patches', () => {
  test('surfaceChangePatch clears invalid smoothness', () => {
    const patch = surfaceChangePatch('excellent', 'grass')
    expect(patch).toEqual({ surface: 'grass', smoothness: undefined })
  })

  test('smoothnessChangePatch writes smoothness key', () => {
    expect(smoothnessChangePatch('good')).toEqual({ smoothness: 'good' })
  })

  test('isSmoothnessValidForSurface respects matrix', () => {
    expect(isSmoothnessValidForSurface('asphalt', 'excellent')).toBe(true)
    expect(isSmoothnessValidForSurface('grass', 'excellent')).toBe(false)
  })

  test('settSizeChangePatch writes surface=sett and sett:length', () => {
    expect(settSizeChangePatch('small_sett', undefined, settLengthForSize)).toEqual({
      surface: 'sett',
      'sett:length': '0.13',
    })
  })

  test('settSizeChangePatch uses channel-specific keys', () => {
    expect(
      settSizeChangePatch(
        'mosaic_sett',
        {
          surfaceKey: 'cycleway:left:surface',
          smoothnessKey: 'cycleway:left:smoothness',
          settLengthKey: 'cycleway:left:sett:length',
        },
        settLengthForSize,
      ),
    ).toEqual({
      'cycleway:left:surface': 'sett',
      'cycleway:left:sett:length': '0.08',
    })
  })
})

describe('surface edit layout', () => {
  mock.module('@osm-editor-kit/osm-sidepath-tags', () => ({
    expandSidepaths: () => [],
  }))

  const layoutModulePromise = import('../modes/surface/domain/surface-edit-layout')

  test('resolveSurfaceEditLayout returns segregated layout for segregated paths', async () => {
    const { resolveSurfaceEditLayout } = await layoutModulePromise
    const wayRef = { type: 'way' as const, id: 42 }

    expect(
      resolveSurfaceEditLayout({ highway: 'cycleway', segregated: 'yes' }, 42, wayRef),
    ).toEqual({
      kind: 'segregated',
      footKeys: {
        surfaceKey: 'surface',
        smoothnessKey: 'smoothness',
        settLengthKey: 'sett:length',
      },
      cycleKeys: {
        surfaceKey: 'cycleway:surface',
        smoothnessKey: 'cycleway:smoothness',
        settLengthKey: 'cycleway:sett:length',
      },
    })
  })

  test('resolveSurfaceEditLayout returns cycleway-sides when a cycleway side is selected', async () => {
    const { resolveSurfaceEditLayout } = await layoutModulePromise

    expect(
      resolveSurfaceEditLayout({ highway: 'residential' }, 42, {
        type: 'way',
        id: 42,
        prefix: 'cycleway',
        side: 'left',
      }),
    ).toEqual({
      kind: 'cycleway-sides',
      leftKeys: {
        surfaceKey: 'cycleway:left:surface',
        smoothnessKey: 'cycleway:left:smoothness',
        settLengthKey: 'cycleway:left:sett:length',
      },
      rightKeys: {
        surfaceKey: 'cycleway:right:surface',
        smoothnessKey: 'cycleway:right:smoothness',
        settLengthKey: 'cycleway:right:sett:length',
      },
    })
  })

  test('resolveSurfaceEditLayout returns single layout for a plain highway', async () => {
    const { resolveSurfaceEditLayout } = await layoutModulePromise
    const wayRef = { type: 'way' as const, id: 42 }

    expect(resolveSurfaceEditLayout({ highway: 'residential' }, 42, wayRef)).toEqual({
      kind: 'single',
      keys: {
        surfaceKey: 'surface',
        smoothnessKey: 'smoothness',
        settLengthKey: 'sett:length',
      },
    })
  })

  test('defaultSameMode matches segregated foot and cycle channels', async () => {
    const { defaultSameMode, resolveSurfaceEditLayout } = await layoutModulePromise
    const layout = resolveSurfaceEditLayout({ highway: 'cycleway', segregated: 'yes' }, 1, {
      type: 'way',
      id: 1,
    })
    expect(layout.kind).toBe('segregated')
    if (layout.kind !== 'segregated') return

    expect(
      defaultSameMode(layout, {
        surface: 'asphalt',
        smoothness: 'good',
        'cycleway:surface': 'asphalt',
        'cycleway:smoothness': 'good',
      }),
    ).toBe(true)
    expect(
      defaultSameMode(layout, {
        surface: 'asphalt',
        'cycleway:surface': 'paving_stones',
      }),
    ).toBe(false)
  })

  test('defaultSameMode matches cycleway left and right channels', async () => {
    const { defaultSameMode, resolveSurfaceEditLayout } = await layoutModulePromise
    const layout = resolveSurfaceEditLayout({ highway: 'residential' }, 1, {
      type: 'way',
      id: 1,
      prefix: 'cycleway',
      side: 'right',
    })
    expect(layout.kind).toBe('cycleway-sides')
    if (layout.kind !== 'cycleway-sides') return

    expect(
      defaultSameMode(layout, {
        'cycleway:left:surface': 'sett',
        'cycleway:left:smoothness': 'bad',
        'cycleway:right:surface': 'sett',
        'cycleway:right:smoothness': 'bad',
      }),
    ).toBe(true)
    expect(
      defaultSameMode(layout, {
        'cycleway:left:surface': 'sett',
        'cycleway:right:surface': 'asphalt',
      }),
    ).toBe(false)
  })
})
