import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'

export function MapResizeHandler({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>
}) {
  const { 'main-map': mapRef } = useMap()

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(() => {
      mapRef?.getMap().resize()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [containerRef, mapRef])

  return null
}
