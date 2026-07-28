import { describe, expect, test } from 'bun:test'
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

describe('surface sidepath offset', () => {
  const offsetModulePromise = import('../modes/surface/map/surface-sidepath-offset')

  test('stacks sidewalk outside cycleway on the same side', async () => {
    const { surfaceSidepathOffsetMeters, SURFACE_SIDEPATH_BAND_GAP_M } = await offsetModulePromise
    const prefixes = ['cycleway', 'sidewalk'] as const
    const cycle = surfaceSidepathOffsetMeters(10, 'cycleway', prefixes)
    const sidewalk = surfaceSidepathOffsetMeters(10, 'sidewalk', prefixes)
    expect(sidewalk - cycle).toBe(SURFACE_SIDEPATH_BAND_GAP_M)
    expect(cycle).toBeGreaterThan(5)
  })

  test('isSeparateSidepathValue detects separate geometry', async () => {
    const { isSeparateSidepathValue } = await offsetModulePromise
    expect(isSeparateSidepathValue('separate')).toBe(true)
    expect(isSeparateSidepathValue('yes')).toBe(false)
    expect(isSeparateSidepathValue('lane')).toBe(false)
  })
})

describe('parseSurfaceFeaturesFromData', () => {
  const parseModulePromise = import('../modes/surface/map/parse-highways')

  function makeData(wayId: number, tags: Record<string, string>, coords: [number, number][]) {
    const nodeIds = coords.map((_, i) => i + 1)
    const nodeCoords: Record<number, number[]> = {}
    for (let i = 0; i < coords.length; i++) {
      const [lat, lon] = coords[i]!
      nodeCoords[i + 1] = [lat, lon]
    }
    return {
      ways: {
        [wayId]: { id: wayId, type: 'way' as const, nodes: nodeIds, tags, version: 1 },
      },
      nodes: {},
      nodeCoords,
      relations: {},
    }
  }

  const bounds = { south: 52.35, west: 13.41, north: 52.36, east: 13.42 }
  const coords: [number, number][] = [
    [52.355, 13.415],
    [52.356, 13.416],
  ]

  test('skips separate sidepaths and stacks on-way sidewalk + cycleway', async () => {
    const { parseSurfaceFeaturesFromData } = await parseModulePromise
    const features = parseSurfaceFeaturesFromData(
      makeData(
        1,
        {
          highway: 'residential',
          width: '10',
          surface: 'asphalt',
          smoothness: 'good',
          'sidewalk:left': 'separate',
          'sidewalk:right': 'yes',
          'sidewalk:right:surface': 'paving_stones',
          'sidewalk:right:smoothness': 'good',
          'cycleway:right': 'lane',
          'cycleway:right:surface': 'asphalt',
          'cycleway:right:smoothness': 'excellent',
        },
        coords,
      ),
      bounds,
      'public',
    )

    const kinds = features.map((f) =>
      f.properties.kind === 'sidepath'
        ? `${f.properties.prefix}/${f.properties.side}`
        : f.properties.kind,
    )
    expect(kinds).toContain('highway')
    expect(kinds).toContain('sidewalk/right')
    expect(kinds).toContain('cycleway/right')
    expect(kinds).not.toContain('sidewalk/left')

    const sidewalk = features.find(
      (f) => f.properties.kind === 'sidepath' && f.properties.prefix === 'sidewalk',
    )
    const cycleway = features.find(
      (f) => f.properties.kind === 'sidepath' && f.properties.prefix === 'cycleway',
    )
    expect(
      sidewalk?.properties.kind === 'sidepath' && sidewalk.properties.offsetMeters,
    ).toBeGreaterThan(
      cycleway?.properties.kind === 'sidepath' ? cycleway.properties.offsetMeters : 0,
    )
  })

  test('emits dual offset channels for segregated paths', async () => {
    const { parseSurfaceFeaturesFromData } = await parseModulePromise
    const features = parseSurfaceFeaturesFromData(
      makeData(
        2,
        {
          highway: 'path',
          bicycle: 'designated',
          foot: 'designated',
          segregated: 'yes',
          surface: 'asphalt',
          smoothness: 'good',
          'cycleway:surface': 'paving_stones',
          'cycleway:smoothness': 'intermediate',
        },
        coords,
      ),
      bounds,
      'inclusive',
    )

    const channels = features
      .filter((f) => f.properties.kind === 'highway')
      .map((f) => (f.properties.kind === 'highway' ? f.properties.channel : undefined))
    expect(channels).toEqual(['foot', 'cycle'])
    expect(features.every((f) => (f.properties.offsetMeters ?? 0) > 0)).toBe(true)
    const foot = features.find(
      (f) => f.properties.kind === 'highway' && f.properties.channel === 'foot',
    )
    const cycle = features.find(
      (f) => f.properties.kind === 'highway' && f.properties.channel === 'cycle',
    )
    expect(foot?.properties.surface).toBe('asphalt')
    expect(cycle?.properties.surface).toBe('paving_stones')
  })
})
