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
import { useEffect } from 'react'
import { useOsmCoverageQuery } from './osm-coverage-query'
import { useHighwayInclusionStyle } from './use-highway-inclusion-style'

type SetChainResult = (chain: SegmentChain | null, pendingJunctions: JunctionChoice[]) => void

/**
 * Build / extend / recenter a way chain for highway modes (lanes, table).
 * Callers own the Zustand store and pass `setChainResult` + `maxPerSide`.
 *
 * Mount the rebuild effect in exactly one place per mode (`rebuild: true`, default).
 * Other callers that only need extend/recenter should pass `rebuild: false` so two
 * effects do not race on the same `setChainResult`.
 */
export function useWayChainBuilder({
  centerWayId,
  maxPerSide,
  setChainResult,
  rebuild = true,
}: {
  centerWayId: number | undefined
  maxPerSide: number
  setChainResult: SetChainResult
  rebuild?: boolean
}) {
  const { data: graph } = useOsmCoverageQuery({ select: (data) => data.graph })
  const inclusionStyle = useHighwayInclusionStyle()

  useEffect(
    function rebuildChainOnCenterChange() {
      if (!rebuild) return

      if (!centerWayId || !graph?.ways[centerWayId]) {
        setChainResult(null, [])
        return
      }

      let cancelled = false
      const adapter = createSessionGraphAdapter(graph)
      const candidateFilter = (segment: Segment) =>
        isEditableRoadLikeSegment(segment, inclusionStyle)

      void buildChain(adapter, {
        centerWayId,
        maxPerSide,
        candidateFilter,
      })
        .then((result) => {
          if (!cancelled) setChainResult(result.chain, result.pendingJunctions)
        })
        .catch(() => {
          if (!cancelled) setChainResult(null, [])
        })

      return () => {
        cancelled = true
      }
    },
    [centerWayId, graph, inclusionStyle, maxPerSide, rebuild, setChainResult],
  )

  async function extendAtJunction(
    choice: JunctionChoice,
    selectedWayId: number,
    currentChain: SegmentChain,
  ) {
    if (!graph) return
    const adapter = createSessionGraphAdapter(graph)
    const candidateFilter = (segment: Segment) => isEditableRoadLikeSegment(segment, inclusionStyle)
    const result = await extendChainAtJunction(
      adapter,
      currentChain,
      choice,
      selectedWayId,
      maxPerSide,
      candidateFilter,
    )
    setChainResult(result.chain, result.pendingJunctions)
  }

  function recenterOnWay(chain: SegmentChain, wayId: number) {
    setChainResult(recenterChain(chain, wayId), [])
  }

  return { extendAtJunction, recenterOnWay }
}

export function visibleChainSegments(
  chain: SegmentChain | null,
  centerWayId: number | undefined,
): Segment[] {
  if (!chain || centerWayId == null) return []

  const centerIndex = chain.segments.findIndex((s) => s.id === centerWayId)
  if (centerIndex === -1) return []

  const prev = centerIndex > 0 ? chain.segments[centerIndex - 1] : undefined
  const center = chain.segments[centerIndex]
  const next = centerIndex < chain.segments.length - 1 ? chain.segments[centerIndex + 1] : undefined

  return [prev, center, next].filter((segment): segment is Segment => segment != null)
}
