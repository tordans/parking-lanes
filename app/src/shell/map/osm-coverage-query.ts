import { createOsmCoverageApi } from '@osm-editor-kit/osm-coverage'
import type { MapBounds } from '@osm-editor-kit/osm-data'
import { getUrl } from '@osm-editor-kit/osm-editor-links'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { viewMinZoom } from '../../modes/parking/map/constants'
import { getUseOsmDevServer, useUseOsmDevServer } from '../debug-settings-store'
import { isDevOsmFixtureActive, useLiveViewportOsmFetch } from '../dev-osm-fixture-store'

export type OsmServerSession = 'dev' | 'prod'

export type OsmSessionParams = {
  osmServer: OsmServerSession
}

function osmServerFromSettings(): OsmServerSession {
  return getUseOsmDevServer() ? 'dev' : 'prod'
}

const osmCoverageApi = createOsmCoverageApi<OsmSessionParams>({
  getSessionKey: ({ osmServer }) => ['street-space-osm', osmServer] as const,
  minZoom: viewMinZoom,
  getDownloadUrl: (bounds, { osmServer }) => getUrl(bounds, osmServer === 'dev'),
  isNetworkEnabled: () => !isDevOsmFixtureActive(),
})

export type OsmCoverageQueryData = ReturnType<typeof osmCoverageApi.emptyData>

export const osmCoverageSessionKey = osmCoverageApi.sessionKey
export const osmCoverageFetchKey = osmCoverageApi.coverageKey
export const emptyOsmCoverageData = osmCoverageApi.emptyData
export const ensureOsmCoverage = osmCoverageApi.ensureCoverage

/** Subscribe to fixture + OSM server so Query keys/`enabled` update when debug toggles change. */
function useOsmSessionParams(): OsmSessionParams {
  useLiveViewportOsmFetch()
  const useOsmDevServer = useUseOsmDevServer()
  return useMemo(() => ({ osmServer: useOsmDevServer ? 'dev' : 'prod' }), [useOsmDevServer])
}

export const useOsmCoverageQuery = osmCoverageApi.createUseQuery(useOsmSessionParams)
export const useIsOsmCoverageFetching = osmCoverageApi.createUseIsFetching(useOsmSessionParams)

export function useOsmCoverageFetch() {
  const queryClient = useQueryClient()
  const isFetching = useIsOsmCoverageFetching()
  const sessionParams = useOsmSessionParams()

  const loadOsmData = useCallback(
    async (
      bounds: MapBounds,
      zoom: number,
      options?: { force?: boolean; mapSizePx?: { width: number; height: number } },
    ) => {
      if (zoom < viewMinZoom) return

      const mapSizePx = options?.mapSizePx ?? { width: 1024, height: 768 }

      try {
        await ensureOsmCoverage(queryClient, {
          bounds,
          zoom,
          mapSizePx,
          ...sessionParams,
          force: options?.force,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(
          message === 'Request failed with status code 429'
            ? 'Too many OSM requests — try again soon'
            : message,
          error,
        )
      }
    },
    [queryClient, sessionParams],
  )

  const refetchAfterSave = useCallback(
    async (bounds: MapBounds, zoom: number, mapSizePx?: { width: number; height: number }) => {
      // Fixture mode blocks network; keep the seeded graph instead of wiping then no-op.
      if (isDevOsmFixtureActive()) return

      queryClient.setQueryData<OsmCoverageQueryData>(
        osmCoverageSessionKey(sessionParams),
        emptyOsmCoverageData(),
      )
      return loadOsmData(bounds, zoom, { force: true, mapSizePx })
    },
    [loadOsmData, queryClient, sessionParams],
  )

  return {
    loadOsmData,
    refetchAfterSave,
    isFetching,
  }
}

/** Wipe all street-space OSM session caches (both prod and dev keys). */
export function clearOsmCoverageSessions(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({ queryKey: ['street-space-osm'] })
}

export function currentOsmSessionParams(): OsmSessionParams {
  return { osmServer: osmServerFromSettings() }
}
