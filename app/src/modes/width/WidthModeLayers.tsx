import { useMapBounds } from '../../shell/app-store'
import { useSelectedOsmRef } from '../../shell/map/feature-selection'
import type { ModeMapProps } from '../types'
import { useWidthMapFeatures } from './map/use-width-map-features'
import { useWidthHandles } from './map/width-map-store'
import { WidthLayers } from './map/WidthLayers'
import { selectedWidthCenterline } from './use-width-mode-handlers'

export function WidthModeLayers(_props: ModeMapProps) {
  const mapBounds = useMapBounds()
  const selectedOsmRef = useSelectedOsmRef()
  const features = useWidthMapFeatures({ bounds: mapBounds })
  const handles = useWidthHandles()

  const selectedRef =
    selectedOsmRef?.type === 'way'
      ? {
          type: 'way' as const,
          id: selectedOsmRef.id,
          prefix: selectedOsmRef.prefix,
          side: selectedOsmRef.side,
        }
      : (selectedOsmRef ?? null)

  const selectedCenterline = selectedWidthCenterline(features, selectedOsmRef)

  return (
    <WidthLayers
      features={features}
      selectedRef={selectedRef}
      selectedCenterline={selectedCenterline}
      handles={handles}
    />
  )
}
