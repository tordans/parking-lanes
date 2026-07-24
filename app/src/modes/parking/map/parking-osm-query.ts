import { createOsmCoverageApi } from '@osm-editor-kit/osm-coverage'
import type { MapBounds } from '@osm-editor-kit/osm-data'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { getUseOsmDevServer } from '../../../shell/debug-settings-store'
import { isDevOsmFixtureActive } from '../../../shell/dev-osm-fixture-store'
import { getUrl } from '../data-url'
import { viewMinZoom } from './constants'

type ParkingSessionParams = Record<never, never>

const parkingSessionParams = {} as ParkingSessionParams

const parkingOsmApi = createOsmCoverageApi<ParkingSessionParams>({
  getSessionKey: () => ['street-space-osm'] as const,
  minZoom: viewMinZoom,
  getDownloadUrl: (bounds) => getUrl(bounds, getUseOsmDevServer()),
})

export type ParkingOsmQueryData = ReturnType<typeof parkingOsmApi.emptyData>

export const parkingOsmSessionKey = parkingOsmApi.sessionKey
export const parkingOsmCoverageKey = parkingOsmApi.coverageKey
export const emptyParkingOsmData = parkingOsmApi.emptyData
export const ensureParkingOsmCoverage = parkingOsmApi.ensureCoverage

function useParkingSessionParams(): ParkingSessionParams {
  return parkingSessionParams
}

export const useParkingOsmQuery = parkingOsmApi.createUseQuery(useParkingSessionParams)
export const useIsParkingOsmFetching = parkingOsmApi.createUseIsFetching(useParkingSessionParams)

export function useParkingOsmFetch() {
  const queryClient = useQueryClient()
  const isFetching = useIsParkingOsmFetching()

  const loadParkingData = useCallback(
    async (
      bounds: MapBounds,
      zoom: number,
      options?: { force?: boolean; mapSizePx?: { width: number; height: number } },
    ) => {
      if (zoom < viewMinZoom) return
      if (isDevOsmFixtureActive()) return

      const mapSizePx = options?.mapSizePx ?? { width: 1024, height: 768 }

      try {
        await ensureParkingOsmCoverage(queryClient, {
          bounds,
          zoom,
          mapSizePx,
          ...parkingSessionParams,
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

      queryClient.setQueryData<ParkingOsmQueryData>(
        parkingOsmSessionKey(parkingSessionParams),
        emptyParkingOsmData(),
      )
      return loadParkingData(bounds, zoom, { force: true, mapSizePx })
    },
    [loadParkingData, queryClient],
  )

  return {
    loadParkingData,
    refetchAfterSave,
    isFetching,
  }
}
