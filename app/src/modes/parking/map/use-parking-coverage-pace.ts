import type { MapBounds } from '@osm-editor-kit/osm-data'
import { useAsyncDebouncer } from '@tanstack/react-pacer'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useEffectEvent } from 'react'
import { useAppActions } from '../../../shell/app-store'
import { coverageFetchDebounceMs, viewMinZoom } from './constants'
import { useParkingOsmFetch } from './parking-osm-query'
import { getMapSizePx, toBounds } from './use-parking-map'

type CoverageFetchArgs = {
  bounds: MapBounds
  zoom: number
  mapSizePx: { width: number; height: number }
}

/**
 * Debounces OSM coverage checks until the map viewport settles ([TanStack Pacer](https://tanstack.com/pacer/latest)).
 * Busy spinner shows while `isPending` (waiting) or `isBusy` (fetching).
 */
export function useParkingCoveragePace() {
  const { loadParkingData, refetchAfterSave, isFetching } = useParkingOsmFetch()
  const { setIsOsmDataBusy } = useAppActions()

  const runCoverageCheck = useEffectEvent(async (args: CoverageFetchArgs) => {
    await loadParkingData(args.bounds, args.zoom, { mapSizePx: args.mapSizePx })
  })

  const coverageDebouncer = useAsyncDebouncer(
    async (args: CoverageFetchArgs) => runCoverageCheck(args),
    { wait: coverageFetchDebounceMs },
    (state) => ({
      isPending: state.isPending,
      isExecuting: state.isExecuting,
    }),
  )

  const isPending = coverageDebouncer.state.isPending === true
  const isExecuting = coverageDebouncer.state.isExecuting === true
  const isBusy = isPending || isExecuting || isFetching

  useEffect(
    function syncOsmDataBusyState() {
      setIsOsmDataBusy(isBusy)
    },
    [isBusy, setIsOsmDataBusy],
  )

  const scheduleCoverageCheck = useEffectEvent((map: MapLibreMap) => {
    const zoom = map.getZoom()
    if (zoom < viewMinZoom) {
      coverageDebouncer.cancel()
      return
    }

    void coverageDebouncer.maybeExecute({
      bounds: toBounds(map.getBounds()),
      zoom,
      mapSizePx: getMapSizePx(map),
    })
  })

  const loadCoverageNow = useEffectEvent(
    async (
      bounds: MapBounds,
      zoom: number,
      options?: { force?: boolean; mapSizePx?: { width: number; height: number } },
    ) => {
      coverageDebouncer.cancel()
      await loadParkingData(bounds, zoom, options)
    },
  )

  return {
    scheduleCoverageCheck,
    loadCoverageNow,
    refetchAfterSave,
    isPending,
    isBusy,
    isFetching: isExecuting || isFetching,
  }
}
