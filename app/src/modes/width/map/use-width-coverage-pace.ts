import type { MapBounds } from '@osm-editor-kit/osm-data'
import { useAsyncDebouncer } from '@tanstack/react-pacer'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { useEffect, useEffectEvent } from 'react'
import { useMapActions } from '../../../shell/map/map-store'
import { getMapSizePx, toBounds } from '../../parking/map/use-parking-map'
import { coverageFetchDebounceMs, viewMinZoom } from './constants'
import { useWidthOsmFetch } from './width-osm-query'

type CoverageFetchArgs = {
  bounds: MapBounds
  zoom: number
  mapSizePx: { width: number; height: number }
}

export function useWidthCoveragePace(enabled = true) {
  const { loadWidthData, refetchAfterSave, isFetching } = useWidthOsmFetch()
  const { setOsmDataBusy } = useMapActions()

  const runCoverageCheck = useEffectEvent(async (args: CoverageFetchArgs) => {
    await loadWidthData(args.bounds, args.zoom, { mapSizePx: args.mapSizePx })
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
    function publishOsmCoverageBusy() {
      // Inactive mode must not clear busy — the active mode's pace owns the flag.
      if (!enabled) return
      setOsmDataBusy(isBusy)
    },
    [enabled, isBusy, setOsmDataBusy],
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
      await loadWidthData(bounds, zoom, options)
    },
  )

  return {
    scheduleCoverageCheck,
    loadCoverageNow,
    refetchAfterSave,
    isFetching: isExecuting || isFetching,
  }
}
