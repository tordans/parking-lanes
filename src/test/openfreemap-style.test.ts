import { describe, expect, test } from 'bun:test'
import type { StyleSpecification } from 'maplibre-gl'
import { patchOpenFreeMapStyle } from '../utils/openfreemap-style'

describe('patchOpenFreeMapStyle', () => {
  test('adds typeof guard to boundary_3 filter', () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'boundary_3',
          type: 'line',
          source: 'openmaptiles',
          'source-layer': 'boundary',
          filter: ['all', ['>=', ['get', 'admin_level'], 3], ['<=', ['get', 'admin_level'], 6]],
        },
      ],
    }

    const patched = patchOpenFreeMapStyle(style)
    const layer = patched.layers[0]!

    expect(layer.filter).toEqual([
      'all',
      ['==', ['typeof', ['get', 'admin_level']], 'number'],
      ['>=', ['get', 'admin_level'], 3],
      ['<=', ['get', 'admin_level'], 6],
    ])
  })
})
