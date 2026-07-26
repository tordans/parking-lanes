import { useMapBounds } from '../../shell/app-store'
import { useSelectedOsmRef } from '../../shell/map/feature-selection'
import type { ModeMapProps } from '../types'
import { useChainNeighborIds, useLanesChainBuilder } from './domain/use-lanes-chain'
import { LanesLayers } from './map/LanesLayers'
import { useLanesMapFeatures } from './map/use-lanes-map-features'

export function LanesModeLayers(_props: ModeMapProps) {
  const mapBounds = useMapBounds()
  const selectedOsmRef = useSelectedOsmRef()
  const features = useLanesMapFeatures({ bounds: mapBounds })

  const centerWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : undefined
  useLanesChainBuilder(centerWayId)
  const { prevWayId, nextWayId } = useChainNeighborIds(centerWayId)

  return (
    <LanesLayers
      features={features}
      selectedWayId={centerWayId ?? null}
      prevWayId={prevWayId}
      nextWayId={nextWayId}
    />
  )
}

export { lanesInteractiveLayerIds as interactiveLayerIds } from './map/LanesLayers'
