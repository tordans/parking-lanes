import type { Segment } from '@osm-editor-kit/osm-way-chain'
import { chainNeighborIds } from '../../../shell/controls/use-chain-walk'
import { useWayChainBuilder, visibleChainSegments } from '../../../shell/map/use-way-chain-builder'
import { useLanesChain, useLanesMapActions } from '../map/lanes-map-store'

const CHAIN_MAX_PER_SIDE = 3

export function useLanesChainBuilder(
  centerWayId: number | undefined,
  options?: { rebuild?: boolean },
) {
  const { setChainResult } = useLanesMapActions()
  return useWayChainBuilder({
    centerWayId,
    maxPerSide: CHAIN_MAX_PER_SIDE,
    setChainResult,
    rebuild: options?.rebuild,
  })
}

export function useChainNeighborIds(centerWayId: number | undefined) {
  const chain = useLanesChain()
  return chainNeighborIds(chain, centerWayId)
}

export function useVisibleChainSegments(centerWayId: number | undefined): Segment[] {
  const chain = useLanesChain()
  return visibleChainSegments(chain, centerWayId)
}
