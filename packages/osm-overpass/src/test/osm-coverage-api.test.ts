import { describe, expect, test } from 'bun:test'
import { emptyParsedOsmData, type MapBounds } from '@osm-editor-kit/osm-data'
import { QueryClient } from '@tanstack/react-query'
import { createOsmCoverageApi } from '../create-osm-coverage-api'
import { OsmDataSource } from '../osm-data-source'

const viewport: MapBounds = {
  south: 52.47,
  west: 13.44,
  north: 52.48,
  east: 13.45,
}

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
      envelope: viewport,
    })

    const result = await testApi.ensureCoverage(queryClient, {
      bounds: viewport,
      zoom: 18,
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
      ...params,
    })

    expect(result.skipped).toBe(true)
  })
})
