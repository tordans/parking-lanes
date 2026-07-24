import { useMap } from 'react-map-gl/maplibre'
import { Button } from '../../components/catalyst/button'
import { viewMinZoom } from '../../modes/parking'
import { MAIN_MAP_ID } from './map-ids'
import { useMapLoaded } from './map-store'
import { useMapViewport } from './map-viewport'

export function ViewMinZoomOverlay() {
  const { zoom } = useMapViewport()
  const maps = useMap()
  const map = maps[MAIN_MAP_ID]
  const mapLoaded = useMapLoaded()

  if (zoom >= viewMinZoom) return null

  const handleZoomIn = () => {
    if (!mapLoaded) return
    map?.easeTo({ zoom: viewMinZoom, duration: 500 })
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
      <div className="pointer-events-auto max-w-sm rounded-xl bg-white/95 px-5 py-4 text-center shadow-lg ring-1 ring-zinc-950/10 backdrop-blur-sm">
        <p className="text-base font-medium text-zinc-900">Zoom in to start loading data</p>
        <Button color="dark/zinc" className="mt-3" onClick={handleZoomIn} disabled={!mapLoaded}>
          Zoom in
        </Button>
      </div>
    </div>
  )
}
