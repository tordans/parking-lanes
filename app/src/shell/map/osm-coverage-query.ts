import { createOsmCoverageApi } from '@osm-editor-kit/osm-coverage'
import type { MapBounds } from '@osm-editor-kit/osm-data'
import { getUrl } from '@osm-editor-kit/osm-editor-links'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { viewMinZoom } from '../../modes/parking/map/constants'
import { getUseOsmDevServer } from '../debug-settings-store'
import { isDevOsmFixtureActive, useLiveViewportOsmFetch } from '../dev-osm-fixture-store'

type OsmSessionParams = Record<never, never>

const osmSessionParams = {} as OsmSessionParams

const osmCoverageApi = createOsmCoverageApi<OsmSessionParams>({
  getSessionKey: () => ['street-space-osm'] as const,
  minZoom: viewMinZoom,
  getDownloadUrl: (bounds) => getUrl(bounds, getUseOsmDevServer()),
  isNetworkEnabled: () => !isDevOsmFixtureActive(),
})

export type OsmCoverageQueryData = ReturnType<typeof osmCoverageApi.emptyData>

export const osmCoverageSessionKey = osmCoverageApi.sessionKey
export const osmCoverageFetchKey = osmCoverageApi.coverageKey
export const emptyOsmCoverageData = osmCoverageApi.emptyData
export const ensureOsmCoverage = osmCoverageApi.ensureCoverage

/** Subscribe to the fixture gate so Query `enabled` updates when the debug toggle changes. */
function useOsmSessionParams(): OsmSessionParams {
  useLiveViewportOsmFetch()
  return osmSessionParams
}

export const useOsmCoverageQuery = osmCoverageApi.createUseQuery(useOsmSessionParams)
export const useIsOsmCoverageFetching = osmCoverageApi.createUseIsFetching(useOsmSessionParams)

export function useOsmCoverageFetch() {
  const queryClient = useQueryClient()
  const isFetching = useIsOsmCoverageFetching()

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
          ...osmSessionParams,
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
    [queryClient],
  )

  const refetchAfterSave = useCallback(
    async (bounds: MapBounds, zoom: number, mapSizePx?: { width: number; height: number }) => {
      // Fixture mode blocks network; keep the seeded graph instead of wiping then no-op.
      if (isDevOsmFixtureActive()) return

      queryClient.setQueryData<OsmCoverageQueryData>(
        osmCoverageSessionKey(osmSessionParams),
        emptyOsmCoverageData(),
      )
      return loadOsmData(bounds, zoom, { force: true, mapSizePx })
    },
    [loadOsmData, queryClient],
  )

  return {
    loadOsmData,
    refetchAfterSave,
    isFetching,
  }
}
