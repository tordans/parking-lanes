import clsx from 'clsx'
import { Compass, LocateFixed } from 'lucide-react'
import { useState, type RefObject } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { mapControlButtonClassName, mapControlsClassName } from './mobileMapChrome.const'

const bearingEpsilon = 0.5

export function MapNavigationControls(props: {
  mapRef: RefObject<MapRef | null>
  bearing: number
  onResetBearing: () => void
}) {
  const [locating, setLocating] = useState(false)
  const isRotated = Math.abs(props.bearing) > bearingEpsilon

  const handleLocate = () => {
    const map = props.mapRef.current?.getMap()
    if (!map) return

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: Math.max(map.getZoom(), 16),
        })
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        alert(error.message || 'Could not determine your location.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <div className={mapControlsClassName}>
      {isRotated ? (
        <button
          type="button"
          aria-label="Reset north"
          className={mapControlButtonClassName}
          onClick={props.onResetBearing}
        >
          <Compass
            className="size-5"
            aria-hidden
            style={{ transform: `rotate(${-props.bearing}deg)` }}
          />
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Locate me"
        className={clsx(mapControlButtonClassName, locating && 'animate-pulse')}
        disabled={locating}
        onClick={handleLocate}
      >
        <LocateFixed className="size-5" aria-hidden />
      </button>
    </div>
  )
}
