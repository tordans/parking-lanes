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
import type { OsmCoveragePersisted, OsmCoverageStorage } from './osm-coverage-storage'

export type { CoverageFetchProps, MapSizePx } from './coverage-geometry'
export type { OsmCoveragePersisted, OsmCoverageStorage } from './osm-coverage-storage'
export { formatCoverageAgeHour, getCoverageSavedAt } from './osm-coverage-storage'

export type OsmCoverageQueryData = {
  graph: ParsedOsmData
  coverage: Feature<Polygon | MultiPolygon> | null
  fetchHistory: FeatureCollection<Polygon, CoverageFetchProps>
  /** ISO timestamp of last durable save / successful network merge; null if never saved. */
  savedAt: string | null
}

export type CreateOsmCoverageApiOptions<TSessionParams> = {
  getSessionKey: (params: TSessionParams) => readonly unknown[]
  minZoom: number
  getDownloadUrl: (bounds: MapBounds, params: TSessionParams) => string
  download?: (url: string) => Promise<ParsedOsmData>
  /** When false, session queries stay enabled=false and ensureCoverage skips network. */
  isNetworkEnabled?: () => boolean
  /** Optional durable store for graph + coverage across reloads. */
  storage?: OsmCoverageStorage
  /** Debounce durable writes after merges (ms). Default 500. */
  storageSaveDebounceMs?: number
}

const DEFAULT_STORAGE_SAVE_DEBOUNCE_MS = 500

export function createOsmCoverageApi<TSessionParams>({
  getSessionKey,
  minZoom,
  getDownloadUrl,
  download = downloadOsmData,
  isNetworkEnabled,
  storage,
  storageSaveDebounceMs = DEFAULT_STORAGE_SAVE_DEBOUNCE_MS,
}: CreateOsmCoverageApiOptions<TSessionParams>) {
  const getCoverageKey = (params: TSessionParams) => [...getSessionKey(params), 'coverage'] as const
  const networkEnabled = () => isNetworkEnabled?.() ?? true
  /** Serialize coverage work per session so concurrent viewports cannot share one fetchQuery. */
  const coverageChains = new Map<string, Promise<unknown>>()
  const hydratedSessions = new Set<string>()
  const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function emptyData(): OsmCoverageQueryData {
    return {
      graph: emptyParsedOsmData(),
      coverage: null,
      fetchHistory: emptyFetchHistory(),
      savedAt: null,
    }
  }

  function scheduleSave(sessionKey: readonly unknown[], data: OsmCoverageQueryData) {
    if (!storage || !data.coverage) return
    const chainKey = JSON.stringify(sessionKey)
    const previous = saveTimers.get(chainKey)
    if (previous) clearTimeout(previous)

    const persisted: OsmCoveragePersisted = {
      graph: data.graph,
      coverage: data.coverage,
      savedAt: data.savedAt ?? new Date().toISOString(),
    }

    saveTimers.set(
      chainKey,
      setTimeout(() => {
        saveTimers.delete(chainKey)
        void storage.save(sessionKey, persisted).catch((error: unknown) => {
          console.error('Failed to persist OSM coverage session', error)
        })
      }, storageSaveDebounceMs),
    )
  }

  /**
   * Load durable session into QueryClient once per session key.
   * Safe to call multiple times; no-ops after the first attempt.
   * Returns true when data was restored from storage.
   */
  async function restoreSession(
    queryClient: QueryClient,
    params: TSessionParams,
    options?: { forceReload?: boolean },
  ): Promise<boolean> {
    if (!storage) return false

    const sessionKey = getSessionKey(params)
    const chainKey = JSON.stringify(sessionKey)

    if (options?.forceReload) {
      hydratedSessions.delete(chainKey)
    }

    if (hydratedSessions.has(chainKey)) return false
    hydratedSessions.add(chainKey)

    const loaded = await storage.load(sessionKey)
    if (!loaded?.coverage) return false

    const current = queryClient.getQueryData<OsmCoverageQueryData>(sessionKey)
    if (current?.coverage) return false

    queryClient.setQueryData<OsmCoverageQueryData>(sessionKey, {
      graph: loaded.graph,
      coverage: loaded.coverage,
      fetchHistory: emptyFetchHistory(),
      savedAt: loaded.savedAt,
    })
    return true
  }

  async function clearPersisted(params: TSessionParams): Promise<void> {
    if (!storage) return
    const sessionKey = getSessionKey(params)
    const chainKey = JSON.stringify(sessionKey)
    const pending = saveTimers.get(chainKey)
    if (pending) {
      clearTimeout(pending)
      saveTimers.delete(chainKey)
    }
    hydratedSessions.delete(chainKey)
    await storage.clear(sessionKey)
  }

  async function ensureCoverage(
    queryClient: QueryClient,
    {
      bounds,
      zoom,
      mapSizePx,
      force = false,
      skipRestore = false,
      clearPersistedOnForce = false,
      ...sessionParams
    }: {
      bounds: MapBounds
      zoom: number
      mapSizePx: MapSizePx
      force?: boolean
      /** Skip durable hydrate for this call (e.g. prefer-fresh). */
      skipRestore?: boolean
      /** When force=true, also wipe durable storage before refetch. */
      clearPersistedOnForce?: boolean
    } & TSessionParams,
  ): Promise<{ skipped: boolean }> {
    if (!networkEnabled()) {
      return { skipped: true }
    }

    const params = sessionParams as TSessionParams
    const sessionKey = getSessionKey(params)
    const coverageKey = getCoverageKey(params)
    const chainKey = JSON.stringify(sessionKey)

    const run = async (): Promise<{ skipped: boolean }> => {
      if (!skipRestore && !force) {
        await restoreSession(queryClient, params)
      }

      if (force && clearPersistedOnForce) {
        await clearPersisted(params)
      }

      // Unique request key: isFetching still matches the coverage prefix, but each call
      // keeps its own bounds/zoom closure (static keys would dedupe onto the wrong fetch).
      const requestKey = [...coverageKey, crypto.randomUUID()] as const

      return queryClient.fetchQuery({
        queryKey: requestKey,
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
          let coverage = force ? null : current.coverage
          let fetchHistory = force ? emptyFetchHistory() : current.fetchHistory
          const fetchedGraphs: ParsedOsmData[] = []

          for (const request of requests) {
            const url = getDownloadUrl(request.bounds, params)
            fetchedGraphs.push(await download(url))
            coverage = unionIntoCoverage(coverage, request.bounds)
          }

          fetchHistory = appendFetchHistory(fetchHistory, groupId, fetchedAt, requests)

          // Merge onto the latest session graph at write time so edits made while
          // downloads were in flight are not wiped by a stale fetch-start snapshot.
          queryClient.setQueryData<OsmCoverageQueryData>(sessionKey, (latest) => {
            const base = force ? emptyData() : (latest ?? emptyData())
            let graph = base.graph
            for (const newGraph of fetchedGraphs) {
              graph = mergeParsedOsm(graph, newGraph)
            }
            const next: OsmCoverageQueryData = {
              graph,
              coverage,
              fetchHistory,
              savedAt: fetchedAt,
            }
            scheduleSave(sessionKey, next)
            return next
          })

          return { skipped: false as const }
        },
        staleTime: 0,
        gcTime: 0,
      })
    }

    const previous = coverageChains.get(chainKey) ?? Promise.resolve()
    const next = previous.then(run, run)
    coverageChains.set(
      chainKey,
      next.then(
        () => undefined,
        () => undefined,
      ),
    )
    return next
  }

  function createUseQuery(useSessionParams: () => TSessionParams) {
    return function useOsmQuery<TData = OsmCoverageQueryData>(options?: {
      select?: (data: OsmCoverageQueryData) => TData
    }) {
      const params = useSessionParams()

      return useQuery({
        queryKey: getSessionKey(params),
        queryFn: () => emptyData(),
        // Placeholder (not initialData) so durable restore via setQueryData is not fought
        // by a permanently seeded empty session.
        placeholderData: emptyData(),
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: Number.POSITIVE_INFINITY,
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
    restoreSession,
    clearPersisted,
    createUseQuery,
    createUseIsFetching,
    createUseResetOnSessionChange,
  }
}
