import { useMapBounds } from '../../shell/app-store'
import { useSelectedOsmRef } from '../../shell/map/feature-selection-store'
import type { ModeMapProps } from '../types'
import { SurfaceLayers } from './map/SurfaceLayers'
import { useSurfaceMapFeatures } from './map/use-surface-map-features'

export function SurfaceModeLayers(_props: ModeMapProps) {
  const mapBounds = useMapBounds()
  const selectedOsmRef = useSelectedOsmRef()
  const features = useSurfaceMapFeatures({ bounds: mapBounds })

  const selectedRef =
    selectedOsmRef?.type === 'way'
      ? {
          type: 'way' as const,
          id: selectedOsmRef.id,
          prefix: selectedOsmRef.prefix,
          side: selectedOsmRef.side,
        }
      : (selectedOsmRef ?? null)

  return <SurfaceLayers features={features} selectedRef={selectedRef} />
}
