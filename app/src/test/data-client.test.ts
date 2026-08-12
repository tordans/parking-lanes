import { describe, expect, test } from 'bun:test'
import { boundsToPolygon } from '@osm-editor-kit/osm-coverage'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { emptyParsedOsmData } from '@osm-editor-kit/osm-data'
import { DEFAULT_HIGHWAY_INCLUSION_STYLE } from '../shell/map/street-space-way-policy'
import type { MapBounds } from '../modes/parking/map/types'

const viewport: MapBounds = {
  south: 52.47,
  west: 13.44,
  north: 52.48,
  east: 13.45,
}

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
    const { currentOsmSessionParams } = await import('../shell/map/osm-coverage-query')
    const { emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../modes/parking/map/parking-osm-query')
    const { updateParkingOsmWay } = await import('../modes/parking/map/parking-osm-edits')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey(currentOsmSessionParams())
    queryClient.setQueryData(key, emptyParkingOsmData())

    const way = makeWay(5, 1, { highway: 'residential', 'parking:lane:right': 'parallel' })
    updateParkingOsmWay(queryClient, way)

    const stored = queryClient.getQueryData<typeof emptyParkingOsmData>(key)
    expect(stored?.graph.ways[5]?.tags['parking:lane:right']).toBe('parallel')
  })

  test('remapParkingOsmWayId moves way to new id', async () => {
    const { QueryClient } = await import('@tanstack/react-query')
    const { currentOsmSessionParams } = await import('../shell/map/osm-coverage-query')
    const { emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../modes/parking/map/parking-osm-query')
    const { remapParkingOsmWayId } = await import('../modes/parking/map/parking-osm-edits')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey(currentOsmSessionParams())
    const initial = emptyParkingOsmData()
    initial.graph.ways[10] = makeWay(10, 1)
    queryClient.setQueryData(key, initial)

    const remapped = remapParkingOsmWayId(queryClient, 10, 99)
    const stored = queryClient.getQueryData<typeof initial>(key)

    expect(remapped?.id).toBe(99)
    expect(stored?.graph.ways[10]).toBeUndefined()
    expect(stored?.graph.ways[99]?.id).toBe(99)
  })
})

describe('deriveParkingMapFeatures', () => {
  test('returns empty collections without bounds', async () => {
    const { deriveParkingMapFeatures } =
      await import('../modes/parking/map/use-parking-map-features')

    const result = deriveParkingMapFeatures(
      emptyParsedOsmData(),
      undefined,
      18,
      new Date('2024-01-01'),
      DEFAULT_HIGHWAY_INCLUSION_STYLE,
    )

    expect(result.lanes.features).toHaveLength(0)
    expect(result.areas.features).toHaveLength(0)
    expect(result.points.features).toHaveLength(0)
  })
})

const mapSizePx = { width: 1000, height: 800 }

describe('ensureParkingOsmCoverage', () => {
  test('skips network when viewport is covered', async () => {
    const { QueryClient } = await import('@tanstack/react-query')
    const { currentOsmSessionParams } = await import('../shell/map/osm-coverage-query')
    const { ensureParkingOsmCoverage, emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../modes/parking/map/parking-osm-query')

    const queryClient = new QueryClient()
    const sessionParams = currentOsmSessionParams()
    const key = parkingOsmSessionKey(sessionParams)
    queryClient.setQueryData(key, {
      graph: emptyParkingOsmData().graph,
      coverage: boundsToPolygon(viewport),
      fetchHistory: { type: 'FeatureCollection', features: [] },
    })

    const result = await ensureParkingOsmCoverage(queryClient, {
      bounds: viewport,
      zoom: 18,
      mapSizePx,
      ...sessionParams,
    })

    expect(result.skipped).toBe(true)
  })
})
