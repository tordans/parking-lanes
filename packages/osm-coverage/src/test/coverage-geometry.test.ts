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
    expect(requests[0]?.bounds.west).toBeLessThan(viewport.west)
    expect(requests[0]?.bounds.east).toBeGreaterThan(viewport.east)
    expect(requests[0]?.bounds.south).toBeLessThan(viewport.south)
    expect(requests[0]?.bounds.north).toBeGreaterThan(viewport.north)
  })

  test('returns no requests when viewport is covered', () => {
    const coverage = boundsToPolygon(viewport)
    const requests = computeMissingFetchRequests(viewport, coverage, 15, mapSizePx)

    expect(requests).toHaveLength(0)
  })

  test('returns an east strip after panning east that overlaps prior coverage', () => {
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
    expect(requests.every((request) => request.kind === 'strip' || request.kind === 'full')).toBe(
      true,
    )
    const eastMost = requests.reduce((best, request) =>
      request.bounds.east > best.bounds.east ? request : best,
    )
    expect(eastMost.bounds.east).toBeGreaterThan(first.east)
    // Seam overlap: new fetch must reach west of the old coverage east edge.
    expect(eastMost.bounds.west).toBeLessThan(first.east)
  })

  test('overscans past the new viewport edge when panning east', () => {
    const coverage = unionIntoCoverage(null, viewport)
    const pannedEast: MapBounds = {
      south: 52.47,
      west: 13.445,
      north: 52.48,
      east: 13.455,
    }

    const requests = computeMissingFetchRequests(pannedEast, coverage, 15, mapSizePx)
    expect(requests.length).toBeGreaterThanOrEqual(1)
    expect(requests.some((request) => request.bounds.east > pannedEast.east)).toBe(true)
  })

  test('small pan inside overscanned coverage needs no fetch', () => {
    const initial = computeMissingFetchRequests(viewport, null, 15, mapSizePx)
    expect(initial).toHaveLength(1)
    const coverage = unionIntoCoverage(null, initial[0]!.bounds)

    const slightEast: MapBounds = {
      south: viewport.south,
      west: viewport.west + 0.001,
      north: viewport.north,
      east: viewport.east + 0.001,
    }

    const requests = computeMissingFetchRequests(slightEast, coverage, 15, mapSizePx)
    expect(requests).toHaveLength(0)
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
