import { describe, expect, it } from 'bun:test'
import type { Feature } from 'geojson'
import {
  buildVegbilderSequenceId,
  intersectsNorway,
  normalizeVegbilderFeature,
  parseVegbilderLayerNames,
  parseVegbilderTimestamp,
  selectVegbilderLayers,
} from './vegbilder'

const capabilitiesSnippet = `
  <Name>vegbilder_1_0:Vegbilder_2019</Name>
  <Name>vegbilder_1_0:Vegbilder_2024</Name>
  <Name>vegbilder_1_0:Vegbilder_360_2024</Name>
  <Name>vegbilder_1_0:Vegbilder_2025</Name>
  <Name>vegbilder_1_0:Vegbilder_360_2025</Name>
  <Name>vegbilder_1_0:Vegbilder_2026</Name>
  <Name>vegbilder_1_0:Vegbilder_360_2026</Name>
`

describe('parseVegbilderLayerNames', () => {
  it('extracts flat and 360 layer names with years', () => {
    const layers = parseVegbilderLayerNames(capabilitiesSnippet)
    expect(layers).toContainEqual({
      name: 'vegbilder_1_0:Vegbilder_360_2025',
      is360: true,
      year: 2025,
    })
    expect(layers).toContainEqual({
      name: 'vegbilder_1_0:Vegbilder_2024',
      is360: false,
      year: 2024,
    })
  })
})

describe('selectVegbilderLayers', () => {
  it('limits recent layers to eight entries', () => {
    const layers = parseVegbilderLayerNames(capabilitiesSnippet)
    const selected = selectVegbilderLayers(layers)
    expect(selected).toHaveLength(6)
    expect(selected).toEqual([
      'vegbilder_1_0:Vegbilder_2026',
      'vegbilder_1_0:Vegbilder_360_2026',
      'vegbilder_1_0:Vegbilder_2025',
      'vegbilder_1_0:Vegbilder_360_2025',
      'vegbilder_1_0:Vegbilder_2024',
      'vegbilder_1_0:Vegbilder_360_2024',
    ])
  })
})

describe('parseVegbilderTimestamp', () => {
  it('parses ISO timestamps with timezone offsets', () => {
    expect(parseVegbilderTimestamp('2025-06-19T04:53:44+02:00')).toBe(
      Date.parse('2025-06-19T04:53:44+02:00'),
    )
  })
})

describe('buildVegbilderSequenceId', () => {
  it('builds a road reference from WFS properties', () => {
    expect(
      buildVegbilderSequenceId({
        FYLKENUMMER: 3,
        VEGKATEGORI: 'R',
        VEGNUMMER: 162,
      }),
    ).toBe('3-R-162')
  })
})

describe('intersectsNorway', () => {
  it('accepts Oslo viewport bboxes', () => {
    expect(intersectsNorway([10.74, 59.9, 10.76, 59.92])).toBe(true)
  })

  it('rejects bboxes outside Norway', () => {
    expect(intersectsNorway([13.4, 52.5, 13.5, 52.6])).toBe(false)
  })
})

describe('normalizeVegbilderFeature', () => {
  it('maps planar WFS features to normalized photos', () => {
    const feature: Feature = {
      type: 'Feature',
      id: 'Vegbilder_2025.2025-06-19T04.53.44_RV00162_S1D40_m00230_Planar_1',
      geometry: { type: 'Point', coordinates: [10.76038414, 59.90144676] },
      properties: {
        BILDETYPE: 'Planar',
        TIDSPUNKT: '2025-06-19T04:53:44+02:00',
        FYLKENUMMER: 3,
        VEGKATEGORI: 'R',
        VEGNUMMER: 162,
        RETNING: 162.20098403073797,
      },
    }

    expect(normalizeVegbilderFeature(feature)).toEqual({
      photoId: 'Vegbilder_2025.2025-06-19T04.53.44_RV00162_S1D40_m00230_Planar_1',
      sequenceId: '3-R-162',
      capturedAt: Date.parse('2025-06-19T04:53:44+02:00'),
      isPano: false,
      heading: 162.20098403073797,
      lngLat: [10.76038414, 59.90144676],
      thumbUrl: undefined,
      fullUrl: undefined,
      viewerYear: 2025,
    })
  })

  it('maps fullUrl from the WFS URL property', () => {
    const feature: Feature = {
      type: 'Feature',
      id: 'vegbilder-full',
      geometry: { type: 'Point', coordinates: [10.76, 59.9] },
      properties: {
        BILDETYPE: '360',
        URL: 'https://example.com/full.jpg',
        URLPREVIEW: 'https://example.com/preview.jpg',
      },
    }

    expect(normalizeVegbilderFeature(feature)?.fullUrl).toBe('https://example.com/full.jpg')
    expect(normalizeVegbilderFeature(feature)?.thumbUrl).toBe('https://example.com/preview.jpg')
  })

  it('maps 360 WFS features as panoramas', () => {
    const feature: Feature = {
      type: 'Feature',
      id: 'Vegbilder_360_2025.2025-07-20T03.43.46_RV00162_S1D40_m00221_360_1',
      geometry: { type: 'Point', coordinates: [10.75, 59.91] },
      properties: {
        BILDETYPE: '360',
        TIDSPUNKT: '2025-07-20T03:43:46+02:00',
        FYLKENUMMER: 3,
        VEGKATEGORI: 'R',
        VEGNUMMER: 162,
        RETNING: 180,
      },
    }

    expect(normalizeVegbilderFeature(feature)?.isPano).toBe(true)
  })
})
