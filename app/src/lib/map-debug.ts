import type { Map as MaplibreMap } from 'maplibre-gl'

declare global {
  interface Window {
    __mainMap?: MaplibreMap
    __mapLoaded?: boolean
    __PLAYWRIGHT_ENABLED?: boolean
  }
}

function isPlaywrightEnabled(): boolean {
  return import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true' || window.__PLAYWRIGHT_ENABLED === true
}

/** Dev + Playwright only — see react-map-gl map-debug-exposure. */
export function exposeMainMapForDebugging(map: MaplibreMap): void {
  if (import.meta.env.DEV || isPlaywrightEnabled()) {
    window.__mainMap = map
  }
}

export function firePlaywrightMapLoadedEvent(): void {
  if (!isPlaywrightEnabled()) return
  window.dispatchEvent(new CustomEvent('mapLoaded'))
  window.__mapLoaded = true
}
