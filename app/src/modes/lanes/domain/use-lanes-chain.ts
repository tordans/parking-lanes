import {
  buildChain,
  createSessionGraphAdapter,
  extendChainAtJunction,
  isEditableRoadLikeSegment,
  recenterChain,
  type JunctionChoice,
  type Segment,
  type SegmentChain,
} from '@osm-editor-kit/osm-way-chain'
import { useCallback, useEffect } from 'react'
import { useHighwayInclusionStyle } from '../../../shell/map/use-highway-inclusion-style'
import { useLanesChain, useLanesMapActions } from '../map/lanes-map-store'
import { useLanesOsmQuery } from '../map/lanes-osm-query'

const CHAIN_MAX_PER_SIDE = 3

export function useLanesChainBuilder(centerWayId: number | undefined) {
  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })
  const { setChainResult } = useLanesMapActions()
  const inclusionStyle = useHighwayInclusionStyle()

  useEffect(
    function rebuildChainOnCenterChange() {
      if (!centerWayId || !graph) {
        setChainResult(null, [])
        return
      }

      let cancelled = false
      const adapter = createSessionGraphAdapter(graph)
      const candidateFilter = (segment: Segment) =>
        isEditableRoadLikeSegment(segment, inclusionStyle)

      void buildChain(adapter, {
        centerWayId,
        maxPerSide: CHAIN_MAX_PER_SIDE,
        candidateFilter,
      }).then((result) => {
        if (!cancelled) setChainResult(result.chain, result.pendingJunctions)
      })

      return () => {
        cancelled = true
      }
    },
    [centerWayId, graph, inclusionStyle, setChainResult],
  )

  const extendAtJunction = useCallback(
    async (choice: JunctionChoice, selectedWayId: number, currentChain: SegmentChain) => {
      if (!graph) return
      const adapter = createSessionGraphAdapter(graph)
      const candidateFilter = (segment: Segment) =>
        isEditableRoadLikeSegment(segment, inclusionStyle)
      const result = await extendChainAtJunction(
        adapter,
        currentChain,
        choice,
        selectedWayId,
        CHAIN_MAX_PER_SIDE,
        candidateFilter,
      )
      setChainResult(result.chain, result.pendingJunctions)
    },
    [graph, inclusionStyle, setChainResult],
  )

  const recenterOnWay = useCallback(
    (chain: SegmentChain, wayId: number) => {
      setChainResult(recenterChain(chain, wayId), [])
    },
    [setChainResult],
  )

  return { extendAtJunction, recenterOnWay }
}

export function useChainNeighborIds(centerWayId: number | undefined) {
  const chain = useLanesChain()
  if (!chain || centerWayId == null) {
    return { prevWayId: null as number | null, nextWayId: null as number | null }
  }

  const centerIndex = chain.segments.findIndex((s) => s.id === centerWayId)
  if (centerIndex === -1) {
    return { prevWayId: null, nextWayId: null }
  }

  return {
    prevWayId: centerIndex > 0 ? (chain.segments[centerIndex - 1]?.id ?? null) : null,
    nextWayId:
      centerIndex < chain.segments.length - 1
        ? (chain.segments[centerIndex + 1]?.id ?? null)
        : null,
  }
}

export function useVisibleChainSegments(centerWayId: number | undefined): Segment[] {
  const chain = useLanesChain()
  if (!chain || centerWayId == null) return []

  const centerIndex = chain.segments.findIndex((s) => s.id === centerWayId)
  if (centerIndex === -1) return []

  const prev = centerIndex > 0 ? chain.segments[centerIndex - 1] : undefined
  const center = chain.segments[centerIndex]
  const next = centerIndex < chain.segments.length - 1 ? chain.segments[centerIndex + 1] : undefined

  return [prev, center, next].filter((segment): segment is Segment => segment != null)
}
