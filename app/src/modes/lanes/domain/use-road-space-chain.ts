import {
  buildRoadSpaceSegment,
  layoutRoadSpace,
  type RoadSpaceScene,
  type RoadSpaceSegment,
  type RoadSpaceSlot,
} from '@osm-editor-kit/osm-lane-diagram'
import type { Segment } from '@osm-editor-kit/osm-way-chain'
import { useSelectedOsmRef } from '../../../shell/map/feature-selection-store'
import { useMapViewport } from '../../../shell/map/map-viewport'
import { useLanesChain } from '../map/lanes-map-store'
import { orientNeighborForCenter } from './orient-neighbor-tags'
import { screenOrderedChainNeighbors } from './screen-ordered-neighbors'
import { useLanesChainBuilder, useVisibleChainSegments } from './use-lanes-chain'

export type RoadSpaceChainView = {
  scene: RoadSpaceScene | null
  currentSlots: RoadSpaceSlot[]
  currentSegment: RoadSpaceSegment | null
  centerWayId: number | undefined
  /** Screen-up neighbour (diagram top). */
  topNeighbor: Segment | null
  /** Screen-down neighbour (diagram bottom). */
  bottomNeighbor: Segment | null
  /** Chain-order prev (digitisation / traversal). */
  chainPrev: Segment | null
  /** Chain-order next. */
  chainNext: Segment | null
  centerSegment: Segment | null
}

/**
 * Selection → oriented prev/current/next → scene + current slots.
 * Neighbour tags are normalised into the current way's direction before parse.
 */
export function useRoadSpaceChain(): RoadSpaceChainView {
  const selectedOsmRef = useSelectedOsmRef()
  const centerWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : undefined
  useLanesChainBuilder(centerWayId)
  const chain = useLanesChain()
  const visibleSegments = useVisibleChainSegments(centerWayId)
  const mapViewport = useMapViewport()

  const empty: RoadSpaceChainView = {
    scene: null,
    currentSlots: [],
    currentSegment: null,
    centerWayId,
    topNeighbor: null,
    bottomNeighbor: null,
    chainPrev: null,
    chainNext: null,
    centerSegment: null,
  }

  if (centerWayId == null || visibleSegments.length === 0) return empty

  const centerIndex = chain != null ? chain.segments.findIndex((s) => s.id === centerWayId) : -1
  const chainPrev = centerIndex > 0 ? (chain?.segments[centerIndex - 1] ?? null) : null
  const chainNext =
    centerIndex >= 0 && chain != null && centerIndex < chain.segments.length - 1
      ? (chain.segments[centerIndex + 1] ?? null)
      : null
  const centerSegment = visibleSegments.find((s) => s.id === centerWayId) ?? null
  if (!centerSegment) return empty

  const { left: bottomNeighbor, right: topNeighbor } = screenOrderedChainNeighbors(
    chainPrev,
    chainNext,
    centerSegment,
    mapViewport.bearing ?? 0,
  )

  const orientedTop =
    topNeighbor != null ? orientNeighborForCenter(centerSegment, topNeighbor) : null
  const orientedBottom =
    bottomNeighbor != null ? orientNeighborForCenter(centerSegment, bottomNeighbor) : null

  // Diagram stacks top → bottom: screen-up neighbour, current, screen-down neighbour.
  const segments: RoadSpaceSegment[] = []
  if (orientedTop) {
    segments.push(buildRoadSpaceSegment(orientedTop.tags, { wayId: orientedTop.id, role: 'prev' }))
  }
  const currentBuilt = buildRoadSpaceSegment(centerSegment.tags, {
    wayId: centerSegment.id,
    role: 'current',
  })
  segments.push(currentBuilt)
  if (orientedBottom) {
    segments.push(
      buildRoadSpaceSegment(orientedBottom.tags, {
        wayId: orientedBottom.id,
        role: 'next',
      }),
    )
  }

  const scene = layoutRoadSpace({ segments })

  return {
    scene,
    currentSlots: currentBuilt.slots,
    currentSegment: currentBuilt,
    centerWayId,
    topNeighbor,
    bottomNeighbor,
    chainPrev,
    chainNext,
    centerSegment,
  }
}
