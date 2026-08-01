import { useMapBounds } from '../../shell/app-store'
import { chainNeighborIds } from '../../shell/controls/use-chain-walk'
import { useSelectedOsmRef } from '../../shell/map/feature-selection-store'
import { useWayChainBuilder } from '../../shell/map/use-way-chain-builder'
import { useLanesMapFeatures } from '../lanes/map/use-lanes-map-features'
import { useBacklightFeatures } from '../parking/map/parking-map-store'
import { ParkingBacklightsSource } from '../parking/map/ParkingBacklightsSource'
import type { ModeMapProps } from '../types'
import { useTableChain, useTableMapActions } from './map/table-map-store'
import { TableHighwaysSource } from './map/TableHighwaysSource'

const CHAIN_MAX_PER_SIDE = 5

export function TableModeLayers(_props: ModeMapProps) {
  const mapBounds = useMapBounds()
  const selectedOsmRef = useSelectedOsmRef()
  const features = useLanesMapFeatures({ bounds: mapBounds })
  const { setChainResult } = useTableMapActions()
  const chain = useTableChain()

  const centerWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : undefined
  useWayChainBuilder({
    centerWayId,
    maxPerSide: CHAIN_MAX_PER_SIDE,
    setChainResult,
  })
  const { prevWayId, nextWayId } = chainNeighborIds(chain, centerWayId)
  const backlights = useBacklightFeatures()

  return (
    <>
      <TableHighwaysSource
        features={features}
        selectedWayId={centerWayId ?? null}
        prevWayId={prevWayId}
        nextWayId={nextWayId}
      />
      <ParkingBacklightsSource collection={backlights} focus="all" />
    </>
  )
}

export { tableInteractiveLayerIds as interactiveLayerIds } from './map/TableHighwaysSource'
