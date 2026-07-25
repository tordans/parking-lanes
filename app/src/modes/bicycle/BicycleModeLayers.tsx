import { useMapBounds } from '../../shell/app-store'
import { useSelectedOsmRef } from '../../shell/map/feature-selection'
import type { ModeMapProps } from '../types'
import { BicycleLayers } from './map/BicycleLayers'
import { useBicycleMapFeatures } from './map/use-bicycle-map-features'
import { selectedBicycleCenterline } from './use-bicycle-mode-handlers'

export function BicycleModeLayers(_props: ModeMapProps) {
  const mapBounds = useMapBounds()
  const selectedOsmRef = useSelectedOsmRef()
  const features = useBicycleMapFeatures({ bounds: mapBounds })

  const selectedRef =
    selectedOsmRef?.type === 'way'
      ? {
          type: 'way' as const,
          id: selectedOsmRef.id,
          prefix: selectedOsmRef.prefix,
          side: selectedOsmRef.side,
        }
      : (selectedOsmRef ?? null)

  const selectedCenterline = selectedBicycleCenterline(features, selectedOsmRef)

  return (
    <BicycleLayers
      features={features}
      selectedRef={selectedRef}
      selectedCenterline={selectedCenterline}
    />
  )
}
