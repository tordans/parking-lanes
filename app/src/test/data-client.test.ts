import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { emptyParsedOsmData } from '@osm-editor-kit/osm-data'
import { OsmDataSource } from '@osm-editor-kit/osm-overpass'
import type { MapBounds } from '../parking/map/types'

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
    const { emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../parking/map/parking-osm-query')
    const { updateParkingOsmWay } = await import('../parking/map/parking-osm-edits')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey({ editorMode: false, osmDataSource: OsmDataSource.OverpassVk })
    queryClient.setQueryData(key, emptyParkingOsmData())

    const way = makeWay(5, 1, { highway: 'residential', 'parking:lane:right': 'parallel' })
    updateParkingOsmWay(queryClient, false, OsmDataSource.OverpassVk, way)

    const stored = queryClient.getQueryData<typeof emptyParkingOsmData>(key)
    expect(stored?.graph.ways[5]?.tags['parking:lane:right']).toBe('parallel')
  })

  test('remapParkingOsmWayId moves way to new id', async () => {
    const { QueryClient } = await import('@tanstack/react-query')
    const { emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../parking/map/parking-osm-query')
    const { remapParkingOsmWayId } = await import('../parking/map/parking-osm-edits')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey({ editorMode: true, osmDataSource: OsmDataSource.OverpassVk })
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
    const { ensureParkingOsmCoverage, emptyParkingOsmData, parkingOsmSessionKey } =
      await import('../parking/map/parking-osm-query')

    const queryClient = new QueryClient()
    const key = parkingOsmSessionKey({ editorMode: false, osmDataSource: OsmDataSource.OverpassVk })
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
