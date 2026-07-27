import * as m from '@app/paraglide/messages'
import clsx from 'clsx'
import { Compass, LocateFixed } from 'lucide-react'
import { useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { toast } from '../../lib/toast'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'
import { useMapViewport } from './map-viewport'
import { MapBackgroundLayerControl } from './MapBackgroundLayerControl'
import { MapExternalLinksControl } from './MapExternalLinksControl'
import {
  mapControlButtonClassName,
  mapControlButtonDividerClassName,
  mapControlButtonGroupClassName,
  mapControlSegmentClassName,
  mapControlsClassName,
} from './mobileMapChrome.const'

const bearingEpsilon = 0.5

export function MapNavigationControls() {
  const { bearing = 0 } = useMapViewport()
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()
  const [locating, setLocating] = useState(false)
  const isRotated = Math.abs(bearing) > bearingEpsilon

  const handleResetBearing = () => {
    if (!mapLoaded) return
    map?.easeTo({ bearing: 0, pitch: 0 })
  }

  const handleLocate = () => {
    if (!mapLoaded) return

    if (!navigator.geolocation) {
      toast.error(m.map_geolocation_unsupported())
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: Math.max(map.getZoom(), 16),
        })
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        toast.error(error.message || m.map_geolocation_failed())
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const locateButton = (
    <button
      type="button"
      aria-label={m.map_locate_me()}
      className={clsx(
        isRotated ? mapControlSegmentClassName : mapControlButtonClassName,
        isRotated && mapControlButtonDividerClassName,
        locating && 'animate-pulse',
      )}
      disabled={locating || !mapLoaded}
      onClick={handleLocate}
    >
      <LocateFixed className="size-5" aria-hidden />
    </button>
  )

  return (
    <div className={`${mapControlsClassName} flex flex-col items-end gap-2`}>
      <MapExternalLinksControl />
      <MapBackgroundLayerControl />
      {isRotated ? (
        <div className={mapControlButtonGroupClassName}>
          <button
            type="button"
            aria-label={m.map_reset_north()}
            className={mapControlSegmentClassName}
            onClick={handleResetBearing}
            disabled={!mapLoaded}
          >
            <Compass
              className="size-5"
              aria-hidden
              style={{ transform: `rotate(${-bearing}deg)` }}
            />
          </button>
          {locateButton}
        </div>
      ) : (
        locateButton
      )}
    </div>
  )
}
