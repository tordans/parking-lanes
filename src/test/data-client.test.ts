import { describe, expect, test } from 'bun:test'
import type { MapBounds } from '../parking/map/types'
import {
  expandFetchedEnvelope,
  isViewportFetched,
  resetFetchedEnvelope,
  setFetchedEnvelopeForTest,
} from '../utils/data-client'

const viewport: MapBounds = {
  south: 52.47,
  west: 13.44,
  north: 52.48,
  east: 13.45,
}

describe('fetched envelope', () => {
  test('empty envelope is not fetched', () => {
    resetFetchedEnvelope()
    expect(isViewportFetched(viewport)).toBe(false)
  })

  test('viewport inside envelope is fetched', () => {
    resetFetchedEnvelope()
    setFetchedEnvelopeForTest(expandFetchedEnvelope(undefined, viewport))
    expect(isViewportFetched(viewport)).toBe(true)
  })

  test('expandFetchedEnvelope grows to cover panning', () => {
    const first: MapBounds = { south: 52.47, west: 13.44, north: 52.48, east: 13.45 }
    const pannedEast: MapBounds = { south: 52.47, west: 13.45, north: 52.48, east: 13.46 }

    let envelope = expandFetchedEnvelope(undefined, first)
    expect(isViewportFetched(first)).toBe(true)
    expect(isViewportFetched(pannedEast)).toBe(false)

    envelope = expandFetchedEnvelope(envelope, pannedEast)
    setFetchedEnvelopeForTest(envelope)
    expect(isViewportFetched(pannedEast)).toBe(true)
    expect(isViewportFetched(first)).toBe(true)
  })
})
