import type { Bbox } from '@osm-editor-kit/street-imagery'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'

/**
 * Live WGS84 bbox from a react-map-gl map instance.
 * @param mapId - react-map-gl `<Map id=…>`
 * @param viewportTrigger - optional value that changes when the camera moves
 *   (e.g. URL map param) so the bbox recomputes after pan/zoom without relying
 *   on MapLibre events.
 */
export const useMapViewportBbox = (mapId: string, viewportTrigger?: unknown): Bbox | null => {
  const { [mapId]: mapRef } = useMap()
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(
    function subscribeMapLoad() {
      if (!mapRef) {
        setMapLoaded(false)
        return
      }

      const map = mapRef.getMap()
      if (map.loaded()) {
        setMapLoaded(true)
        return
      }

      const onLoad = () => {
        setMapLoaded(true)
      }
      void map.once('load', onLoad)
      return () => {
        map.off('load', onLoad)
      }
    },
    [mapRef],
  )

  if (!mapRef || !mapLoaded) {
    return null
  }

  const bounds = mapRef.getBounds()
  if (!bounds) {
    return null
  }

  void viewportTrigger

  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
}
