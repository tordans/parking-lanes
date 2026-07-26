import type { LaneDirection } from '@osm-editor-kit/osm-lanes'
import type { JunctionChoice, SegmentChain } from '@osm-editor-kit/osm-way-chain'
import { create } from 'zustand'

export type LanesViewMode = 'cross-section' | 'table'

export type SelectedSlotRef = {
  wayId: number
  direction: LaneDirection
  index: number
}

interface LanesMapStore {
  chain: SegmentChain | null
  pendingJunctions: JunctionChoice[]
  selectedSlot: SelectedSlotRef | null
  viewMode: LanesViewMode
  actions: {
    setChainResult: (chain: SegmentChain | null, pendingJunctions: JunctionChoice[]) => void
    selectSlot: (slot: SelectedSlotRef | null) => void
    setViewMode: (mode: LanesViewMode) => void
    clearLanesState: () => void
  }
}

const useLanesMapStore = create<LanesMapStore>()((set) => ({
  chain: null,
  pendingJunctions: [],
  selectedSlot: null,
  viewMode: 'cross-section',
  actions: {
    setChainResult: (chain, pendingJunctions) => set({ chain, pendingJunctions }),
    selectSlot: (selectedSlot) => set({ selectedSlot }),
    setViewMode: (viewMode) => set({ viewMode }),
    clearLanesState: () =>
      set({
        chain: null,
        pendingJunctions: [],
        selectedSlot: null,
        viewMode: 'cross-section',
      }),
  },
}))

export const useLanesChain = () => useLanesMapStore((s) => s.chain)
export const useLanesPendingJunctions = () => useLanesMapStore((s) => s.pendingJunctions)
export const useSelectedLaneSlot = () => useLanesMapStore((s) => s.selectedSlot)
export const useLanesViewMode = () => useLanesMapStore((s) => s.viewMode)
export const useLanesMapActions = () => useLanesMapStore((s) => s.actions)
