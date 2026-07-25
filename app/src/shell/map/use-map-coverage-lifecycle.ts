import { serializeMapParam, setLocationToCookie } from '@osm-editor-kit/osm-map-url'
import {
  OPENFREEMAP_POSITRON_STYLE_URL,
  openFreeMapTransformStyle,
} from '@osm-editor-kit/osm-maplibre'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useRef } from 'react'
import type { MapEvent, ViewStateChangeEvent } from 'react-map-gl/maplibre'
import { exposeMainMapForDebugging, firePlaywrightMapLoadedEvent } from '../../lib/map-debug'
import { getMapSizePx, toBounds, useParkingCoveragePace, viewMinZoom } from '../../modes/parking'
import type { StreetSpaceModeId } from '../../modes/types'
import { useWidthCoveragePace, viewMinZoom as widthViewMinZoom } from '../../modes/width'
import { useAppActions } from '../app-store'
import { useMapActions } from './map-store'
import { serializeMapSearch } from './search-schema'

export function useMapCoverageLifecycle() {
  const navigate = useNavigate({ from: '/$mode' })
  const { map: mapSearch } = useSearch({ from: '/$mode' })
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const resolvedModeId = modeSlug as StreetSpaceModeId
  const isWidthMode = resolvedModeId === 'width'
  const styleTransformApplied = useRef(false)

  const { setMapBounds } = useAppActions()
  const { markMapLoaded, setMapTilesLoading } = useMapActions()
  const parkingCoverage = useParkingCoveragePace(!isWidthMode)
  const widthCoverage = useWidthCoveragePace(isWidthMode)
  const { scheduleCoverageCheck, loadCoverageNow } = isWidthMode ? widthCoverage : parkingCoverage
  const minZoom = isWidthMode ? widthViewMinZoom : viewMinZoom

  function writeMapViewport(
    viewState: ViewStateChangeEvent['viewState'],
    bounds: ReturnType<typeof toBounds>,
  ) {
    const { zoom, latitude, longitude, bearing } = viewState
    setMapBounds(bounds)
    setLocationToCookie({ lat: latitude, lng: longitude }, zoom)

    void navigate({
      search: (prev) => ({
        ...serializeMapSearch(prev),
        map: serializeMapParam({ zoom, lat: latitude, lng: longitude, bearing }),
      }),
      replace: true,
    })
  }

  function onMove(event: ViewStateChangeEvent) {
    scheduleCoverageCheck(event.target)
  }

  function onMoveEnd(event: ViewStateChangeEvent) {
    const map = event.target
    writeMapViewport(event.viewState, toBounds(map.getBounds()))
    scheduleCoverageCheck(map)
  }

  function onMapData() {
    setMapTilesLoading(true)
  }

  function onMapIdle() {
    setMapTilesLoading(false)
  }

  function onMapLoad(event: MapEvent) {
    const map = event.target

    if (!styleTransformApplied.current) {
      styleTransformApplied.current = true
      map.setStyle(OPENFREEMAP_POSITRON_STYLE_URL, {
        transformStyle: openFreeMapTransformStyle,
      })
    }

    markMapLoaded()
    exposeMainMapForDebugging(map)
    firePlaywrightMapLoadedEvent()

    const zoom = map.getZoom()
    const center = map.getCenter()
    const bearing = map.getBearing()
    const bounds = toBounds(map.getBounds())
    setMapBounds(bounds)

    if (!mapSearch) {
      void navigate({
        search: (prev) => ({
          ...serializeMapSearch(prev),
          map: serializeMapParam({
            zoom,
            lat: center.lat,
            lng: center.lng,
            bearing: bearing || undefined,
          }),
        }),
        replace: true,
      })
    }

    if (zoom >= minZoom) {
      void loadCoverageNow(bounds, zoom, { mapSizePx: getMapSizePx(map) })
    }
  }

  return { onMapLoad, onMove, onMoveEnd, onMapData, onMapIdle }
}
