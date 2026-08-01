import { setLocationToCookie } from '@osm-editor-kit/osm-map-url'
import { useParams } from '@tanstack/react-router'
import type { MapEvent, ViewStateChangeEvent } from 'react-map-gl/maplibre'
import { exposeMainMapForDebugging, firePlaywrightMapLoadedEvent } from '../../lib/map-debug'
import { useLanesCoveragePace, viewMinZoom as lanesViewMinZoom } from '../../modes/lanes'
import { getMapSizePx, toBounds, useParkingCoveragePace, viewMinZoom } from '../../modes/parking'
import type { StreetSpaceModeId } from '../../modes/types'
import { useWidthCoveragePace, viewMinZoom as widthViewMinZoom } from '../../modes/width'
import { useAppActions } from '../app-store'
import { useMapActions } from './map-store'
import { useModeSearchNavigation } from './use-mode-search-navigation'

export function useMapCoverageLifecycle() {
  const { search, updateSearch } = useModeSearchNavigation()
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const resolvedModeId = modeSlug as StreetSpaceModeId
  const isWidthMode = resolvedModeId === 'width'
  const isLanesMode = resolvedModeId === 'lanes'
  const isTableMode = resolvedModeId === 'table'
  const usesHighwayCoverage = isWidthMode || isLanesMode || isTableMode

  const { setMapBounds } = useAppActions()
  const { markMapLoaded, setMapTilesLoading } = useMapActions()
  const parkingCoverage = useParkingCoveragePace(!usesHighwayCoverage)
  const widthCoverage = useWidthCoveragePace(isWidthMode)
  const lanesCoverage = useLanesCoveragePace(isLanesMode || isTableMode)
  const activeCoverage =
    isLanesMode || isTableMode ? lanesCoverage : isWidthMode ? widthCoverage : parkingCoverage
  const minZoom =
    isLanesMode || isTableMode ? lanesViewMinZoom : isWidthMode ? widthViewMinZoom : viewMinZoom

  const { scheduleCoverageCheck, loadCoverageNow } = activeCoverage

  function writeMapViewport(
    viewState: ViewStateChangeEvent['viewState'],
    bounds: ReturnType<typeof toBounds>,
  ) {
    const { zoom, latitude, longitude, bearing } = viewState
    setMapBounds(bounds)
    setLocationToCookie({ lat: latitude, lng: longitude }, zoom)

    updateSearch(
      {
        map: { zoom, lat: latitude, lng: longitude, bearing },
      },
      { replace: true },
    )
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

    markMapLoaded()
    exposeMainMapForDebugging(map)
    firePlaywrightMapLoadedEvent()

    const zoom = map.getZoom()
    const center = map.getCenter()
    const bearing = map.getBearing()
    const bounds = toBounds(map.getBounds())
    setMapBounds(bounds)

    if (!search.map) {
      updateSearch(
        {
          map: {
            zoom,
            lat: center.lat,
            lng: center.lng,
            bearing: bearing || undefined,
          },
        },
        { replace: true },
      )
    }

    if (zoom >= minZoom) {
      void loadCoverageNow(bounds, zoom, { mapSizePx: getMapSizePx(map) })
    }
  }

  return { onMapLoad, onMove, onMoveEnd, onMapData, onMapIdle }
}
