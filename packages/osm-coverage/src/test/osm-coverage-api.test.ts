import { describe, expect, test } from 'bun:test'
import { emptyParsedOsmData, type MapBounds } from '@osm-editor-kit/osm-data'
import { QueryClient } from '@tanstack/react-query'
import { boundsToPolygon } from '../coverage-geometry'
import { createOsmCoverageApi } from '../create-osm-coverage-api'
import { OsmDataSource } from '../osm-data-source'

const viewport: MapBounds = {
  south: 52.47,
  west: 13.44,
  north: 52.48,
  east: 13.45,
}

const mapSizePx = { width: 1000, height: 800 }

type TestSessionParams = {
  editorMode: boolean
  osmDataSource: OsmDataSource
}

const testApi = createOsmCoverageApi<TestSessionParams>({
  getSessionKey: ({ editorMode, osmDataSource }) =>
    ['test-osm', editorMode, osmDataSource] as const,
  minZoom: 14,
  getDownloadUrl: () => 'https://example.test/overpass',
  download: async () => emptyParsedOsmData(),
})

describe('ensureCoverage', () => {
  test('skips network when viewport is covered', async () => {
    const queryClient = new QueryClient()
    const params = { editorMode: false, osmDataSource: OsmDataSource.OverpassVk }
    const key = testApi.sessionKey(params)
    queryClient.setQueryData(key, {
      graph: emptyParsedOsmData(),
      coverage: boundsToPolygon(viewport),
      fetchHistory: { type: 'FeatureCollection', features: [] },
    })

    const result = await testApi.ensureCoverage(queryClient, {
      bounds: viewport,
      zoom: 18,
      mapSizePx,
      ...params,
    })

    expect(result.skipped).toBe(true)
  })

  test('skips fetch when zoom is below minZoom', async () => {
    const queryClient = new QueryClient()
    const params = { editorMode: false, osmDataSource: OsmDataSource.OverpassVk }

    const result = await testApi.ensureCoverage(queryClient, {
      bounds: viewport,
      zoom: 10,
      mapSizePx,
      ...params,
    })

    expect(result.skipped).toBe(true)
  })

  test('records fetch history after a fetch', async () => {
    const queryClient = new QueryClient()
    const params = { editorMode: false, osmDataSource: OsmDataSource.OverpassVk }
    const key = testApi.sessionKey(params)

    await testApi.ensureCoverage(queryClient, {
      bounds: viewport,
      zoom: 18,
      mapSizePx,
      ...params,
    })

    const stored = queryClient.getQueryData<ReturnType<typeof testApi.emptyData>>(key)
    expect(stored?.coverage).not.toBeNull()
    expect(stored?.fetchHistory.features).toHaveLength(1)
    expect(stored?.fetchHistory.features[0]?.properties.kind).toBe('initial')
  })

  test('skips network when isNetworkEnabled returns false', async () => {
    let downloads = 0
    const api = createOsmCoverageApi<TestSessionParams>({
      getSessionKey: ({ editorMode, osmDataSource }) =>
        ['test-osm-disabled', editorMode, osmDataSource] as const,
      minZoom: 14,
      getDownloadUrl: () => 'https://example.test/overpass',
      download: async () => {
        downloads += 1
        return emptyParsedOsmData()
      },
      isNetworkEnabled: () => false,
    })

    const queryClient = new QueryClient()
    const params = { editorMode: false, osmDataSource: OsmDataSource.OverpassVk }

    const result = await api.ensureCoverage(queryClient, {
      bounds: viewport,
      zoom: 18,
      mapSizePx,
      ...params,
    })

    expect(result.skipped).toBe(true)
    expect(downloads).toBe(0)
  })

  test('runs concurrent viewport fetches serially with each call’s bounds', async () => {
    let releaseFirst!: () => void
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    let downloadCount = 0

    const api = createOsmCoverageApi<TestSessionParams>({
      getSessionKey: ({ editorMode, osmDataSource }) =>
        ['test-osm-serial', editorMode, osmDataSource] as const,
      minZoom: 14,
      getDownloadUrl: () => 'https://example.test/overpass',
      download: async () => {
        downloadCount += 1
        if (downloadCount === 1) await firstGate
        return emptyParsedOsmData()
      },
    })

    const queryClient = new QueryClient()
    const params = { editorMode: false, osmDataSource: OsmDataSource.OverpassVk }
    const otherViewport: MapBounds = {
      south: 52.5,
      west: 13.5,
      north: 52.51,
      east: 13.51,
    }

    const first = api.ensureCoverage(queryClient, {
      bounds: viewport,
      zoom: 18,
      mapSizePx,
      ...params,
    })
    const second = api.ensureCoverage(queryClient, {
      bounds: otherViewport,
      zoom: 18,
      mapSizePx,
      ...params,
    })

    // Let the first download start, then unblock so the second can run with its own bounds.
    await Bun.sleep(10)
    releaseFirst()
    await Promise.all([first, second])

    const stored = queryClient.getQueryData<ReturnType<typeof api.emptyData>>(
      api.sessionKey(params),
    )
    expect(stored?.fetchHistory.features.length).toBe(2)
    expect(downloadCount).toBe(2)
  })
})
