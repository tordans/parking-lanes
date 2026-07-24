import { describe, expect, test } from 'bun:test'
import type { MapBounds } from '@osm-editor-kit/osm-data'
import {
  appendFetchHistory,
  boundsToPolygon,
  bufferPxAtZoom,
  capFetchHistory,
  computeMissingFetchRequests,
  emptyFetchHistory,
  unionIntoCoverage,
} from '../coverage-geometry'

const mapSizePx = { width: 1000, height: 800 }

const viewport: MapBounds = {
  south: 52.47,
  west: 13.44,
  north: 52.48,
  east: 13.45,
}

describe('bufferPxAtZoom', () => {
  test('interpolates between z13 and z17', () => {
    expect(bufferPxAtZoom(13)).toBe(200)
    expect(bufferPxAtZoom(17)).toBe(350)
    expect(bufferPxAtZoom(15)).toBe(275)
  })
})

describe('computeMissingFetchRequests', () => {
  test('returns one initial request without coverage', () => {
    const requests = computeMissingFetchRequests(viewport, null, 15, mapSizePx)

    expect(requests).toHaveLength(1)
    expect(requests[0]?.kind).toBe('initial')
    expect(requests[0]?.bounds.west).toBeLessThanOrEqual(viewport.west)
    expect(requests[0]?.bounds.east).toBeGreaterThanOrEqual(viewport.east)
  })

  test('returns no requests when viewport is covered', () => {
    const coverage = boundsToPolygon(viewport)
    const requests = computeMissingFetchRequests(viewport, coverage, 15, mapSizePx)

    expect(requests).toHaveLength(0)
  })

  test('returns an east strip after panning east', () => {
    const first = viewport
    const coverage = unionIntoCoverage(null, first)
    const pannedEast: MapBounds = {
      south: 52.47,
      west: 13.445,
      north: 52.48,
      east: 13.455,
    }

    const requests = computeMissingFetchRequests(pannedEast, coverage, 15, mapSizePx)

    expect(requests.length).toBeGreaterThanOrEqual(1)
    expect(requests.length).toBeLessThanOrEqual(2)
    expect(requests.every((request) => request.kind === 'strip')).toBe(true)
    expect(requests[0]?.bounds.east).toBeGreaterThan(first.east)
  })

  test('falls back to one full viewport for large remainders', () => {
    const tinyCoverage = boundsToPolygon({
      south: 52.475,
      west: 13.445,
      north: 52.476,
      east: 13.446,
    })

    const requests = computeMissingFetchRequests(viewport, tinyCoverage, 15, mapSizePx)

    expect(requests).toHaveLength(1)
    expect(requests[0]?.kind).toBe('full')
  })
})

describe('fetchHistory', () => {
  test('caps feature and group counts', () => {
    let history = emptyFetchHistory()

    for (let group = 0; group < 25; group++) {
      history = appendFetchHistory(history, `group-${group}`, new Date().toISOString(), [
        {
          bounds: viewport,
          kind: 'strip',
        },
      ])
    }

    const capped = capFetchHistory(history)
    expect(capped.features.length).toBeLessThanOrEqual(40)
    expect(
      new Set(capped.features.map((feature) => feature.properties.groupId)).size,
    ).toBeLessThanOrEqual(20)
  })
})
