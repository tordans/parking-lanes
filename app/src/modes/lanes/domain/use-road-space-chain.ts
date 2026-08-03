import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
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
import { useLanesOsmQuery } from '../map/lanes-osm-query'
import { findDualCarriagewaySibling } from './find-dual-carriageway-sibling'
import { medianHintForWay } from './median-hint'
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

function dualSiblingForSegment(
  graph: ParsedOsmData | undefined,
  segment: { id: number; tags: Record<string, string> },
): { wayId: number; tags: Record<string, string>; perpendicularDistanceM?: number } | undefined {
  if (!graph) return undefined
  const match = findDualCarriagewaySibling(graph, segment.id)
  if (!match) return undefined
  const tags = graph.ways[match.wayId]?.tags
  if (!tags) return undefined
  return {
    wayId: match.wayId,
    tags: { ...tags },
    perpendicularDistanceM: match.distanceM,
  }
}

/**
 * Selection → oriented prev/current/next → scene + current slots.
 * Neighbour tags are normalised into the current way's direction before parse.
 * Dual oneway bands resolve the opposite carriageway branch when present in the
 * loaded OSM graph (real slots instead of a mirrored placeholder).
 */
export function useRoadSpaceChain(): RoadSpaceChainView {
  const selectedOsmRef = useSelectedOsmRef()
  const centerWayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : undefined
  useLanesChainBuilder(centerWayId, { rebuild: false })
  const chain = useLanesChain()
  const visibleSegments = useVisibleChainSegments(centerWayId)
  const mapViewport = useMapViewport()
  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })

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
    segments.push(
      buildRoadSpaceSegment(orientedTop.tags, {
        wayId: orientedTop.id,
        role: 'prev',
        dualSibling: dualSiblingForSegment(graph, orientedTop),
        medianHint: medianHintForWay(graph, orientedTop.id),
      }),
    )
  }
  const currentBuilt = buildRoadSpaceSegment(centerSegment.tags, {
    wayId: centerSegment.id,
    role: 'current',
    dualSibling: dualSiblingForSegment(graph, centerSegment),
    medianHint: medianHintForWay(graph, centerSegment.id),
  })
  segments.push(currentBuilt)
  if (orientedBottom) {
    segments.push(
      buildRoadSpaceSegment(orientedBottom.tags, {
        wayId: orientedBottom.id,
        role: 'next',
        dualSibling: dualSiblingForSegment(graph, orientedBottom),
        medianHint: medianHintForWay(graph, orientedBottom.id),
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
