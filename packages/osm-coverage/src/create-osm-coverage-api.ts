import {
  downloadOsmData,
  emptyParsedOsmData,
  mergeParsedOsm,
  type MapBounds,
  type ParsedOsmData,
} from '@osm-editor-kit/osm-data'
import { type QueryClient, useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { useEffect } from 'react'
import {
  appendFetchHistory,
  computeMissingFetchRequests,
  createViewportFetchRequest,
  emptyFetchHistory,
  type CoverageFetchProps,
  type MapSizePx,
  unionIntoCoverage,
} from './coverage-geometry'

export type { CoverageFetchProps, MapSizePx } from './coverage-geometry'

export type OsmCoverageQueryData = {
  graph: ParsedOsmData
  coverage: Feature<Polygon | MultiPolygon> | null
  fetchHistory: FeatureCollection<Polygon, CoverageFetchProps>
}

export type CreateOsmCoverageApiOptions<TSessionParams> = {
  getSessionKey: (params: TSessionParams) => readonly unknown[]
  minZoom: number
  getDownloadUrl: (bounds: MapBounds, params: TSessionParams) => string
  download?: (url: string) => Promise<ParsedOsmData>
  /** When false, session queries stay enabled=false and ensureCoverage skips network. */
  isNetworkEnabled?: () => boolean
}

export function createOsmCoverageApi<TSessionParams>({
  getSessionKey,
  minZoom,
  getDownloadUrl,
  download = downloadOsmData,
  isNetworkEnabled,
}: CreateOsmCoverageApiOptions<TSessionParams>) {
  const getCoverageKey = (params: TSessionParams) => [...getSessionKey(params), 'coverage'] as const
  const networkEnabled = () => isNetworkEnabled?.() ?? true

  function emptyData(): OsmCoverageQueryData {
    return {
      graph: emptyParsedOsmData(),
      coverage: null,
      fetchHistory: emptyFetchHistory(),
    }
  }

  async function ensureCoverage(
    queryClient: QueryClient,
    {
      bounds,
      zoom,
      mapSizePx,
      force = false,
      ...sessionParams
    }: {
      bounds: MapBounds
      zoom: number
      mapSizePx: MapSizePx
      force?: boolean
    } & TSessionParams,
  ): Promise<{ skipped: boolean }> {
    if (!networkEnabled()) {
      return { skipped: true }
    }

    const params = sessionParams as TSessionParams
    const sessionKey = getSessionKey(params)
    const coverageKey = getCoverageKey(params)

    const result = await queryClient.fetchQuery({
      queryKey: coverageKey,
      queryFn: async () => {
        const current = force
          ? emptyData()
          : (queryClient.getQueryData<OsmCoverageQueryData>(sessionKey) ?? emptyData())

        if (zoom < minZoom) {
          return { skipped: true as const }
        }

        const requests = force
          ? (() => {
              const full = createViewportFetchRequest(bounds, zoom, mapSizePx, 'full')
              return full ? [full] : []
            })()
          : computeMissingFetchRequests(bounds, current.coverage, zoom, mapSizePx)

        if (requests.length === 0) {
          return { skipped: true as const }
        }

        const groupId = crypto.randomUUID()
        const fetchedAt = new Date().toISOString()
        let graph = current.graph
        let coverage = force ? null : current.coverage
        let fetchHistory = force ? emptyFetchHistory() : current.fetchHistory

        for (const request of requests) {
          const url = getDownloadUrl(request.bounds, params)
          const newGraph = await download(url)
          graph = mergeParsedOsm(graph, newGraph)
          coverage = unionIntoCoverage(coverage, request.bounds)
        }

        fetchHistory = appendFetchHistory(fetchHistory, groupId, fetchedAt, requests)

        queryClient.setQueryData<OsmCoverageQueryData>(sessionKey, {
          graph,
          coverage,
          fetchHistory,
        })

        return { skipped: false as const }
      },
      staleTime: 0,
      gcTime: 0,
    })

    return result
  }

  function createUseQuery(useSessionParams: () => TSessionParams) {
    return function useOsmQuery<TData = OsmCoverageQueryData>(options?: {
      select?: (data: OsmCoverageQueryData) => TData
    }) {
      const params = useSessionParams()

      return useQuery({
        queryKey: getSessionKey(params),
        queryFn: () => emptyData(),
        initialData: emptyData(),
        staleTime: Number.POSITIVE_INFINITY,
        enabled: networkEnabled(),
        select: options?.select,
      })
    }
  }

  function createUseIsFetching(useSessionParams: () => TSessionParams) {
    return function useIsOsmFetching() {
      const params = useSessionParams()
      return useIsFetching({ queryKey: getCoverageKey(params) }) > 0
    }
  }

  function createUseResetOnSessionChange(useSessionParams: () => TSessionParams) {
    return function useResetOsmOnSessionChange() {
      const queryClient = useQueryClient()
      const params = useSessionParams()

      useEffect(
        function resetOsmDataOnSessionChange() {
          queryClient.setQueryData(getSessionKey(params), emptyData())
          queryClient.removeQueries({
            queryKey: getCoverageKey(params),
          })
        },
        [params, queryClient],
      )
    }
  }

  return {
    emptyData,
    sessionKey: getSessionKey,
    coverageKey: getCoverageKey,
    ensureCoverage,
    createUseQuery,
    createUseIsFetching,
    createUseResetOnSessionChange,
  }
}
