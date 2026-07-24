import { describe, expect, test } from 'bun:test'
import type { MapBounds } from '../parking/map/types'
import {
  emptyParsedOsmData,
  expandFetchedEnvelope,
  isViewportFetched,
  mergeParsedOsm,
} from '../utils/data-client'
import type { OsmWay } from '../utils/types/osm-data'

const viewport: MapBounds = {
  south: 52.47,
  west: 13.44,
  north: 52.48,
  east: 13.45,
}

describe('fetched envelope', () => {
  test('empty envelope is not fetched', () => {
    expect(isViewportFetched(viewport, null)).toBe(false)
  })

  test('viewport inside envelope is fetched', () => {
    const envelope = expandFetchedEnvelope(null, viewport)
    expect(isViewportFetched(viewport, envelope)).toBe(true)
  })

  test('expandFetchedEnvelope grows to cover panning', () => {
    const first: MapBounds = { south: 52.47, west: 13.44, north: 52.48, east: 13.45 }
    const pannedEast: MapBounds = { south: 52.47, west: 13.45, north: 52.48, east: 13.46 }

    let envelope = expandFetchedEnvelope(null, first)
    expect(isViewportFetched(first, envelope)).toBe(true)
    expect(isViewportFetched(pannedEast, envelope)).toBe(false)

    envelope = expandFetchedEnvelope(envelope, pannedEast)
    expect(isViewportFetched(pannedEast, envelope)).toBe(true)
    expect(isViewportFetched(first, envelope)).toBe(true)
  })
})

describe('mergeParsedOsm', () => {
  test('merges nodes and keeps newer way versions', () => {
    const existing = emptyParsedOsmData()
    existing.ways[1] = {
      type: 'way',
      id: 1,
      version: 1,
      nodes: [10, 11],
      tags: { highway: 'residential' },
    }

    const incoming = emptyParsedOsmData()
    incoming.nodeCoords[10] = [52.47, 13.44]
    incoming.ways[1] = {
      type: 'way',
      id: 1,
      version: 2,
      nodes: [10, 11],
      tags: { highway: 'residential', 'parking:lane:right': 'parallel' },
    }

    const merged = mergeParsedOsm(existing, incoming)
    expect(merged.nodeCoords[10]).toEqual([52.47, 13.44])
    expect(merged.ways[1]?.version).toBe(2)
    expect(merged.ways[1]?.tags['parking:lane:right']).toBe('parallel')
  })

  test('keeps existing way when incoming version is older', () => {
    const existing = emptyParsedOsmData()
    existing.ways[1] = {
      type: 'way',
      id: 1,
      version: 3,
      nodes: [10],
      tags: { highway: 'residential', name: 'Kept' },
    }

    const incoming = emptyParsedOsmData()
    incoming.ways[1] = {
      type: 'way',
      id: 1,
      version: 2,
      nodes: [10],
      tags: { highway: 'residential', name: 'Stale' },
    }

    const merged = mergeParsedOsm(existing, incoming)
    expect(merged.ways[1]?.tags.name).toBe('Kept')
  })
})

describe('parseOsmResp', () => {
  test('parses ways and relation membership', async () => {
    const { parseOsmResp } = await import('../utils/data-client')
    const parsed = parseOsmResp({
      elements: [
        {
          type: 'way',
          id: 42,
          version: 1,
          nodes: [1, 2],
          tags: { highway: 'residential' },
        },
        {
          type: 'relation',
          id: 7,
          version: 1,
          members: [{ type: 'way', ref: 42, role: 'outer' }],
          tags: { amenity: 'parking' },
        },
      ],
    })

    expect(parsed.ways[42]?.id).toBe(42)
    expect(parsed.relations[7]?.id).toBe(7)
    expect(parsed.waysInRelation[42]).toBe(true)
  })
})

function makeWay(
  id: number,
  version: number,
  tags: OsmWay['tags'] = { highway: 'residential' },
): OsmWay {
  return { type: 'way', id, version, nodes: [1, 2, 3], tags }
}

describe('parking osm edits', () => {
  test('updateParkingOsmWay stores immutable way copy', async () => {
    const { QueryClient } = await import('@tanstack/react-query')
    const { OsmDataSource } = await import('../utils/types/osm-data')
    const { emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../parking/map/parking-osm-query')
    const { updateParkingOsmWay } = await import('../parking/map/parking-osm-edits')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey(false, OsmDataSource.OverpassVk)
    queryClient.setQueryData(key, emptyParkingOsmData())

    const way = makeWay(5, 1, { highway: 'residential', 'parking:lane:right': 'parallel' })
    updateParkingOsmWay(queryClient, false, OsmDataSource.OverpassVk, way)

    const stored = queryClient.getQueryData<typeof emptyParkingOsmData>(key)
    expect(stored?.graph.ways[5]?.tags['parking:lane:right']).toBe('parallel')
  })

  test('remapParkingOsmWayId moves way to new id', async () => {
    const { QueryClient } = await import('@tanstack/react-query')
    const { OsmDataSource } = await import('../utils/types/osm-data')
    const { emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../parking/map/parking-osm-query')
    const { remapParkingOsmWayId } = await import('../parking/map/parking-osm-edits')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey(true, OsmDataSource.OverpassVk)
    const initial = emptyParkingOsmData()
    initial.graph.ways[10] = makeWay(10, 1)
    queryClient.setQueryData(key, initial)

    const remapped = remapParkingOsmWayId(queryClient, true, OsmDataSource.OverpassVk, 10, 99)
    const stored = queryClient.getQueryData<typeof initial>(key)

    expect(remapped?.id).toBe(99)
    expect(stored?.graph.ways[10]).toBeUndefined()
    expect(stored?.graph.ways[99]?.id).toBe(99)
  })
})

describe('deriveParkingMapFeatures', () => {
  test('returns empty collections without bounds', async () => {
    const { deriveParkingMapFeatures } = await import('../parking/map/use-parking-map-features')
    const { emptyParsedOsmData } = await import('../utils/data-client')

    const result = deriveParkingMapFeatures(
      emptyParsedOsmData(),
      undefined,
      18,
      new Date('2024-01-01'),
      false,
    )

    expect(result.lanes.features).toHaveLength(0)
    expect(result.areas.features).toHaveLength(0)
    expect(result.points.features).toHaveLength(0)
  })
})

describe('ensureParkingOsmCoverage', () => {
  test('skips network when viewport is covered', async () => {
    const { QueryClient } = await import('@tanstack/react-query')
    const { OsmDataSource } = await import('../utils/types/osm-data')
    const { ensureParkingOsmCoverage, emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../parking/map/parking-osm-query')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey(false, OsmDataSource.OverpassVk)
    queryClient.setQueryData(key, {
      graph: emptyParkingOsmData().graph,
      envelope: viewport,
    })

    const result = await ensureParkingOsmCoverage(queryClient, {
      bounds: viewport,
      zoom: 18,
      editorMode: false,
      osmDataSource: OsmDataSource.OverpassVk,
    })

    expect(result.skipped).toBe(true)
  })
})
