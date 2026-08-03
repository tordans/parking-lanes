import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'

/**
 * MapLibre's `compact` attribution still starts expanded (`maplibregl-compact-show`)
 * and only minimizes on drag. For this narrower app chrome, collapse to the info
 * button as soon as the control appears; stop once the user opens it.
 */
export function CollapseMapAttribution() {
  const maps = useMap()
  const mapRef = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()

  useEffect(
    function collapseAttributionUntilUserOpens() {
      const map = mapRef?.getMap()
      if (!map || !mapLoaded) return

      const root = map.getContainer()
      let allowAutoCollapse = true

      function collapse() {
        if (!allowAutoCollapse) return
        for (const el of root.querySelectorAll('.maplibregl-ctrl-attrib.maplibregl-compact')) {
          el.classList.remove('maplibregl-compact-show')
          el.removeAttribute('open')
        }
      }

      function onPointerDown(event: Event) {
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.closest('.maplibregl-ctrl-attrib')) allowAutoCollapse = false
      }

      collapse()
      const raf = requestAnimationFrame(collapse)
      const timeout = window.setTimeout(collapse, 400)
      root.addEventListener('pointerdown', onPointerDown, true)
      map.on('idle', collapse)

      return function cleanupCollapseAttribution() {
        cancelAnimationFrame(raf)
        window.clearTimeout(timeout)
        root.removeEventListener('pointerdown', onPointerDown, true)
        map.off('idle', collapse)
      }
    },
    [mapLoaded, mapRef],
  )

  return null
}
