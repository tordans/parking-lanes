import type { MapBounds } from '@osm-editor-kit/osm-data'
import { createOsmCoverageApi, OsmDataSource } from '@osm-editor-kit/osm-overpass'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useAppActions, useEditorMode, useOsmDataSource } from '../app-store'
import { getUrl } from '../data-url'
import { viewMinZoom } from './constants'

const useDevServer = false

type ParkingSessionParams = {
  editorMode: boolean
  osmDataSource: OsmDataSource
}

const parkingOsmApi = createOsmCoverageApi<ParkingSessionParams>({
  getSessionKey: ({ editorMode, osmDataSource }) =>
    ['parking-osm', editorMode, osmDataSource] as const,
  minZoom: viewMinZoom,
  getDownloadUrl: (bounds, { editorMode, osmDataSource }) =>
    getUrl(bounds, editorMode, useDevServer, osmDataSource),
})

export type ParkingOsmQueryData = ReturnType<typeof parkingOsmApi.emptyData>

export const parkingOsmSessionKey = parkingOsmApi.sessionKey
export const parkingOsmCoverageKey = parkingOsmApi.coverageKey
export const emptyParkingOsmData = parkingOsmApi.emptyData
export const ensureParkingOsmCoverage = parkingOsmApi.ensureCoverage

function useParkingSessionParams(): ParkingSessionParams {
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  return { editorMode, osmDataSource }
}

export const useParkingOsmQuery = parkingOsmApi.createUseQuery(useParkingSessionParams)
export const useIsParkingOsmFetching = parkingOsmApi.createUseIsFetching(useParkingSessionParams)

export function useParkingOsmFetch() {
  const queryClient = useQueryClient()
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  const { setFetchButtonText } = useAppActions()
  const isFetching = useIsParkingOsmFetching()

  const loadParkingData = useCallback(
    async (bounds: MapBounds, zoom: number, options?: { force?: boolean }) => {
      if (zoom < viewMinZoom) return

      setFetchButtonText('Fetching data...')
      try {
        await ensureParkingOsmCoverage(queryClient, {
          bounds,
          zoom,
          editorMode,
          osmDataSource,
          force: options?.force,
        })
        setFetchButtonText('Fetch parking data')
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : ''
        const errorMessage =
          message === 'Request failed with status code 429'
            ? 'Error: Too many requests - try again soon'
            : 'Unknown error, please try again'
        setFetchButtonText(errorMessage)
      }
    },
    [editorMode, osmDataSource, queryClient, setFetchButtonText],
  )

  const refetchAfterSave = useCallback(
    async (bounds: MapBounds, zoom: number) => {
      queryClient.setQueryData<ParkingOsmQueryData>(
        parkingOsmSessionKey({ editorMode, osmDataSource }),
        emptyParkingOsmData(),
      )
      return loadParkingData(bounds, zoom, { force: true })
    },
    [editorMode, loadParkingData, osmDataSource, queryClient],
  )

  return {
    loadParkingData,
    refetchAfterSave,
    isFetching,
  }
}

export function useResetParkingOsmOnSessionChange() {
  const queryClient = useQueryClient()
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()

  useEffect(
    function resetOsmDataOnSessionChange() {
      queryClient.setQueryData(
        parkingOsmSessionKey({ editorMode, osmDataSource }),
        emptyParkingOsmData(),
      )
      queryClient.removeQueries({
        queryKey: parkingOsmCoverageKey({ editorMode, osmDataSource }),
      })
    },
    [editorMode, osmDataSource, queryClient],
  )
}
