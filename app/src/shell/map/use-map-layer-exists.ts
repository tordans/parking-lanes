import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { MAIN_MAP_ID } from './map-ids'

/** True once `layerId` is present on the main map (re-checked on `styledata`). */
export function useMapLayerExists(layerId: string): boolean {
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const [exists, setExists] = useState(() => map?.getLayer(layerId) != null)

  useEffect(
    function syncLayerExistence() {
      if (!map) {
        setExists(false)
        return
      }

      const sync = () => {
        setExists(map.getLayer(layerId) != null)
      }
      sync()
      map.on('styledata', sync)
      return () => {
        map.off('styledata', sync)
      }
    },
    [layerId, map],
  )

  return exists
}
