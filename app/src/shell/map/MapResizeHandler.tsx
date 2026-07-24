import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'

export function MapResizeHandler({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>
}) {
  const maps = useMap()
  const mapRef = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()

  useEffect(
    function observeMapContainerResize() {
      const element = containerRef.current
      if (!element || !mapLoaded) return

      const observer = new ResizeObserver(() => {
        mapRef?.resize()
      })
      observer.observe(element)
      return function disconnectMapContainerResizeObserver() {
        observer.disconnect()
      }
    },
    [containerRef, mapLoaded, mapRef],
  )

  return null
}
