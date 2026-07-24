import {
  downloadOsmData,
  emptyParsedOsmData,
  expandFetchedEnvelope,
  isViewportFetched,
  mergeParsedOsm,
  type MapBounds,
  type ParsedOsmData,
} from '@osm-editor-kit/osm-data'
import { type QueryClient, useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export type OsmCoverageQueryData = {
  graph: ParsedOsmData
  envelope: MapBounds | null
}

export type CreateOsmCoverageApiOptions<TSessionParams> = {
  getSessionKey: (params: TSessionParams) => readonly unknown[]
  minZoom: number
  getDownloadUrl: (bounds: MapBounds, params: TSessionParams) => string
  download?: (url: string) => Promise<ParsedOsmData>
}

export function createOsmCoverageApi<TSessionParams>({
  getSessionKey,
  minZoom,
  getDownloadUrl,
  download = downloadOsmData,
}: CreateOsmCoverageApiOptions<TSessionParams>) {
  const getCoverageKey = (params: TSessionParams) => [...getSessionKey(params), 'coverage'] as const

  function emptyData(): OsmCoverageQueryData {
    return {
      graph: emptyParsedOsmData(),
      envelope: null,
    }
  }

  async function ensureCoverage(
    queryClient: QueryClient,
    {
      bounds,
      zoom,
      force = false,
      ...sessionParams
    }: {
      bounds: MapBounds
      zoom: number
      force?: boolean
    } & TSessionParams,
  ): Promise<{ skipped: boolean }> {
    const params = sessionParams as TSessionParams
    const sessionKey = getSessionKey(params)
    const coverageKey = getCoverageKey(params)

    const result = await queryClient.fetchQuery({
      queryKey: coverageKey,
      queryFn: async () => {
        const current = queryClient.getQueryData<OsmCoverageQueryData>(sessionKey) ?? emptyData()

        if (zoom < minZoom) {
          return { skipped: true as const }
        }

        if (!force && isViewportFetched(bounds, current.envelope)) {
          return { skipped: true as const }
        }

        const url = getDownloadUrl(bounds, params)
        const newGraph = await download(url)
        const mergedGraph = mergeParsedOsm(current.graph, newGraph)

        queryClient.setQueryData<OsmCoverageQueryData>(sessionKey, {
          graph: mergedGraph,
          envelope: expandFetchedEnvelope(current.envelope, bounds),
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
