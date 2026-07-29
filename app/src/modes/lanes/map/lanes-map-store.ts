import type { JunctionChoice, SegmentChain } from '@osm-editor-kit/osm-way-chain'
import { create } from 'zustand'

interface LanesMapStore {
  chain: SegmentChain | null
  pendingJunctions: JunctionChoice[]
  /** Transient form hover/focus highlight for the plan sketch — not an editor selection. */
  highlightedSlotId: string | null
  actions: {
    setChainResult: (chain: SegmentChain | null, pendingJunctions: JunctionChoice[]) => void
    setHighlightedSlot: (slotId: string | null) => void
    clearLanesState: () => void
  }
}

const useLanesMapStore = create<LanesMapStore>()((set) => ({
  chain: null,
  pendingJunctions: [],
  highlightedSlotId: null,
  actions: {
    setChainResult: (chain, pendingJunctions) => set({ chain, pendingJunctions }),
    setHighlightedSlot: (highlightedSlotId) => set({ highlightedSlotId }),
    clearLanesState: () =>
      set({
        chain: null,
        pendingJunctions: [],
        highlightedSlotId: null,
      }),
  },
}))

export const useLanesChain = () => useLanesMapStore((s) => s.chain)
export const useLanesPendingJunctions = () => useLanesMapStore((s) => s.pendingJunctions)
export const useHighlightedLaneSlotId = () => useLanesMapStore((s) => s.highlightedSlotId)
export const useLanesMapActions = () => useLanesMapStore((s) => s.actions)
