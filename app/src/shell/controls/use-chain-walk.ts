import type { SegmentChain } from '@osm-editor-kit/osm-way-chain'
import { useEffect, useEffectEvent } from 'react'
import type { RefObject } from 'react'

export function chainNeighborIds(chain: SegmentChain | null, centerWayId: number | undefined) {
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

type Axis = 'horizontal' | 'vertical'

/**
 * Prev/next walk + optional ←/→ or ↑/↓ keyboard binding on a focusable container.
 * Pass `prevWayId`/`nextWayId` to override chain order (e.g. lanes screen-ordered neighbours).
 */
export function useChainWalk({
  chain = null,
  centerWayId,
  walkToWay,
  prevWayId: prevWayIdProp,
  nextWayId: nextWayIdProp,
  axis = 'horizontal',
  containerRef,
}: {
  chain?: SegmentChain | null
  centerWayId?: number
  walkToWay: (wayId: number) => void
  prevWayId?: number | null
  nextWayId?: number | null
  axis?: Axis | false
  containerRef?: RefObject<HTMLElement | null>
}) {
  const fromChain = chainNeighborIds(chain, centerWayId)
  const prevWayId = prevWayIdProp !== undefined ? prevWayIdProp : fromChain.prevWayId
  const nextWayId = nextWayIdProp !== undefined ? nextWayIdProp : fromChain.nextWayId

  const walkPrev = useEffectEvent(() => {
    if (prevWayId != null) walkToWay(prevWayId)
  })

  const walkNext = useEffectEvent(() => {
    if (nextWayId != null) walkToWay(nextWayId)
  })

  useEffect(
    function keyboardWalkAlongChain() {
      if (!axis || !containerRef) return
      const panel = containerRef.current
      if (!panel) return

      const prevKey = axis === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
      const nextKey = axis === 'horizontal' ? 'ArrowRight' : 'ArrowDown'

      function onKeyDown(event: KeyboardEvent) {
        if (isTypingTarget(event.target)) return
        if (event.key === prevKey) {
          event.preventDefault()
          walkPrev()
        } else if (event.key === nextKey) {
          event.preventDefault()
          walkNext()
        }
      }

      panel.addEventListener('keydown', onKeyDown)
      return () => panel.removeEventListener('keydown', onKeyDown)
    },
    [axis, containerRef],
  )

  return { prevWayId, nextWayId, walkPrev, walkNext }
}
