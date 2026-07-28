import { describe, expect, test } from 'bun:test'
import type { StyleSpecification } from 'maplibre-gl'
import { patchOpenFreeMapStyle } from '../patch-openfreemap-style'

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

  test('is idempotent when the guard is already present', () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'boundary_3',
          type: 'line',
          source: 'openmaptiles',
          'source-layer': 'boundary',
          filter: [
            'all',
            ['==', ['typeof', ['get', 'admin_level']], 'number'],
            ['>=', ['get', 'admin_level'], 3],
          ],
        },
      ],
    }

    expect(patchOpenFreeMapStyle(style).layers[0]!.filter).toEqual(style.layers[0]!.filter)
  })

  test('leaves other layers unchanged', () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'boundary_2',
          type: 'line',
          source: 'openmaptiles',
          'source-layer': 'boundary',
          filter: ['==', ['get', 'admin_level'], 2],
        },
      ],
    }

    expect(patchOpenFreeMapStyle(style)).toEqual(style)
  })
})
