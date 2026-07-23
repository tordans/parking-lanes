import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { downloadBbox, osmData, resetFetchedEnvelope } from '../../utils/data-client'
import type { OsmDataSource } from '../../utils/types/osm-data'
import { useAppActions, useDatetime, useEditorMode, useOsmDataSource } from '../app-store'
import { getUrl } from '../data-url'
import { viewMinZoom } from './constants'
import { getParkingMapState, useParkingMapActions } from './parking-map-store'
import { syncDatetimeColors } from './parking-map-sync'
import { parseParkingFeaturesFromData } from './parse-parking-data'
import type { MapBounds } from './types'

const useDevServer = false

export const parkingOsmSessionKey = (editorMode: boolean, osmDataSource: OsmDataSource) =>
  ['parking-osm', editorMode, osmDataSource] as const

function existingFeatureIds() {
  const { lanes, areas, points } = getParkingMapState()
  return new Set([
    ...lanes.features.map((feature) => feature.properties.featureId),
    ...areas.features.map((feature) => feature.properties.featureId),
    ...points.features.map((feature) => feature.properties.featureId),
  ])
}

function appendParsedFeatures(
  bounds: MapBounds,
  zoom: number,
  editorMode: boolean,
  mapActions: ReturnType<typeof useParkingMapActions>,
  datetime: Date,
  onlyNew = false,
) {
  const { lanes, areas, points } = parseParkingFeaturesFromData(
    osmData,
    bounds,
    zoom,
    editorMode,
    onlyNew ? existingFeatureIds() : undefined,
  )

  if (lanes.length) mapActions.addLanes(lanes)
  if (areas.length) mapActions.addAreas(areas)
  if (points.length) mapActions.addPoints(points)

  if (lanes.length || areas.length || points.length) {
    syncDatetimeColors(datetime)
  }

  return { lanes, areas, points }
}

export function useParkingOsmFetch() {
  const editorMode = useEditorMode()
  const osmDataSource = useOsmDataSource()
  const datetime = useDatetime()
  const { setFetchButtonText } = useAppActions()
  const mapActions = useParkingMapActions()

  useEffect(
    function resetEnvelopeOnSourceChange() {
      resetFetchedEnvelope()
    },
    [editorMode, osmDataSource],
  )

  const mutation = useMutation({
    mutationKey: parkingOsmSessionKey(editorMode, osmDataSource),
    mutationFn: async ({
      bounds,
      zoom,
      force = false,
    }: {
      bounds: MapBounds
      zoom: number
      force?: boolean
    }) => {
      if (zoom < viewMinZoom) return { skipped: true as const }

      const url = getUrl(bounds, editorMode, useDevServer, osmDataSource)
      const { newData, skipped } = await downloadBbox(bounds, url, { force })

      if (skipped) {
        appendParsedFeatures(bounds, zoom, editorMode, mapActions, datetime, true)
        return { skipped: true as const }
      }

      if (!newData) return { skipped: true as const }

      appendParsedFeatures(bounds, zoom, editorMode, mapActions, datetime, false)
      return { skipped: false as const }
    },
    onMutate: () => {
      setFetchButtonText('Fetching data...')
    },
    onSuccess: () => {
      setFetchButtonText('Fetch parking data')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : ''
      const errorMessage =
        message === 'Request failed with status code 429'
          ? 'Error: Too many requests - try again soon'
          : 'Unknown error, please try again'
      setFetchButtonText(errorMessage)
    },
  })

  const loadParkingData = useCallback(
    (bounds: MapBounds, zoom: number, options?: { force?: boolean }) => {
      if (zoom < viewMinZoom) return Promise.resolve()
      return mutation.mutateAsync({ bounds, zoom, force: options?.force })
    },
    [mutation],
  )

  const refetchAfterSave = useCallback(
    async (bounds: MapBounds, zoom: number) => {
      resetFetchedEnvelope()
      return loadParkingData(bounds, zoom, { force: true })
    },
    [loadParkingData],
  )

  return {
    loadParkingData,
    refetchAfterSave,
    isFetching: mutation.isPending,
  }
}
