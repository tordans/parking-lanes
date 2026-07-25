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
  const highways = useWidthMapFeatures({ bounds: mapBounds })
  const handles = useWidthHandles()

  const selectedOsmId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : null
  const selectedCenterline = selectedWidthCenterline(highways, selectedOsmRef)

  return (
    <WidthLayers
      highways={highways}
      selectedOsmId={selectedOsmId}
      selectedCenterline={selectedCenterline}
      handles={handles}
    />
  )
}
