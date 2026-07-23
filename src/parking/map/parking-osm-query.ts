import { type QueryClient, useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import {
  downloadOsmData,
  emptyParsedOsmData,
  expandFetchedEnvelope,
  isViewportFetched,
  mergeParsedOsm,
} from '../../utils/data-client'
import type { OsmDataSource } from '../../utils/types/osm-data'
import type { ParsedOsmData } from '../../utils/types/osm-data-storage'
import { useAppActions, useEditorMode, useOsmDataSource } from '../app-store'
import { getUrl } from '../data-url'
import { viewMinZoom } from './constants'
import type { MapBounds } from './types'

const useDevServer = false

export type ParkingOsmQueryData = {
  graph: ParsedOsmData
  envelope: MapBounds | null
}

export const parkingOsmSessionKey = (editorMode: boolean, osmDataSource: OsmDataSource) =>
  ['parking-osm', editorMode, osmDataSource] as const

export const parkingOsmCoverageKey = (editorMode: boolean, osmDataSource: OsmDataSource) =>
  [...parkingOsmSessionKey(editorMode, osmDataSource), 'coverage'] as const

export function emptyParkingOsmData(): ParkingOsmQueryData {
  return {
    graph: emptyParsedOsmData(),
    envelope: null,
  }
}

export function useParkingOsmQuery<TData = ParkingOsmQueryData>(options?: {
  select?: (data: ParkingOsmQueryData) => TData
}) {
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()

  return useQuery({
    queryKey: parkingOsmSessionKey(editorMode, osmDataSource),
    queryFn: () => emptyParkingOsmData(),
    initialData: emptyParkingOsmData(),
    staleTime: Number.POSITIVE_INFINITY,
    select: options?.select,
  })
}

export function useIsParkingOsmFetching() {
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  return useIsFetching({ queryKey: parkingOsmCoverageKey(editorMode, osmDataSource) }) > 0
}

export async function ensureParkingOsmCoverage(
  queryClient: QueryClient,
  {
    bounds,
    zoom,
    editorMode,
    osmDataSource,
    force = false,
  }: {
    bounds: MapBounds
    zoom: number
    editorMode: boolean
    osmDataSource: OsmDataSource
    force?: boolean
  },
): Promise<{ skipped: boolean }> {
  const sessionKey = parkingOsmSessionKey(editorMode, osmDataSource)
  const coverageKey = parkingOsmCoverageKey(editorMode, osmDataSource)

  const result = await queryClient.fetchQuery({
    queryKey: coverageKey,
    queryFn: async () => {
      const current =
        queryClient.getQueryData<ParkingOsmQueryData>(sessionKey) ?? emptyParkingOsmData()

      if (zoom < viewMinZoom) {
        return { skipped: true as const }
      }

      if (!force && isViewportFetched(bounds, current.envelope)) {
        return { skipped: true as const }
      }

      const url = getUrl(bounds, editorMode, useDevServer, osmDataSource)
      const newGraph = await downloadOsmData(url)
      const mergedGraph = mergeParsedOsm(current.graph, newGraph)

      queryClient.setQueryData<ParkingOsmQueryData>(sessionKey, {
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
        parkingOsmSessionKey(editorMode, osmDataSource),
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
        parkingOsmSessionKey(editorMode, osmDataSource),
        emptyParkingOsmData(),
      )
      queryClient.removeQueries({
        queryKey: parkingOsmCoverageKey(editorMode, osmDataSource),
      })
    },
    [editorMode, osmDataSource, queryClient],
  )
}
