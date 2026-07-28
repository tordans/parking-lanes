import { describe, expect, test } from 'bun:test'
import type { StyleSpecification } from 'maplibre-gl'
import { patchOpenFreeMapStyle } from '../patch-openfreemap-style'

describe('patchOpenFreeMapStyle', () => {
  test('coalesces null-unsafe admin_level compares on boundary_3', () => {
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

    expect(patchOpenFreeMapStyle(style).layers[0]!.filter).toEqual([
      'all',
      ['>=', ['coalesce', ['get', 'admin_level'], -1e18], 3],
      ['<=', ['coalesce', ['get', 'admin_level'], 1e18], 6],
    ])
  })

  test('coalesces null-unsafe ref_length compares on highway shields', () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'highway-shield-non-us',
          type: 'symbol',
          source: 'openmaptiles',
          'source-layer': 'transportation_name',
          filter: ['all', ['<=', ['get', 'ref_length'], 6]],
        },
      ],
    }

    expect(patchOpenFreeMapStyle(style).layers[0]!.filter).toEqual([
      'all',
      ['<=', ['coalesce', ['get', 'ref_length'], 1e18], 6],
    ])
  })

  test('coalesces null-unsafe rank compares on country labels', () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'label_country_3',
          type: 'symbol',
          source: 'openmaptiles',
          'source-layer': 'place',
          filter: ['all', ['==', ['get', 'class'], 'country'], ['>=', ['get', 'rank'], 3]],
        },
      ],
    }

    expect(patchOpenFreeMapStyle(style).layers[0]!.filter).toEqual([
      'all',
      ['==', ['get', 'class'], 'country'],
      ['>=', ['coalesce', ['get', 'rank'], -1e18], 3],
    ])
  })

  test('is idempotent when coalesces are already present', () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'boundary_3',
          type: 'line',
          source: 'openmaptiles',
          'source-layer': 'boundary',
          filter: ['all', ['>=', ['coalesce', ['get', 'admin_level'], -1e18], 3]],
        },
      ],
    }

    expect(patchOpenFreeMapStyle(style).layers[0]!.filter).toEqual(style.layers[0]!.filter)
  })

  test('leaves non-numeric filters unchanged', () => {
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
