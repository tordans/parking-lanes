import type { JunctionChoice, SegmentChain } from '@osm-editor-kit/osm-way-chain'
import { create } from 'zustand'

interface TableMapStore {
  chain: SegmentChain | null
  pendingJunctions: JunctionChoice[]
  actions: {
    setChainResult: (chain: SegmentChain | null, pendingJunctions: JunctionChoice[]) => void
    clearTableState: () => void
  }
}

const useTableMapStore = create<TableMapStore>()((set) => ({
  chain: null,
  pendingJunctions: [],
  actions: {
    setChainResult: (chain, pendingJunctions) => set({ chain, pendingJunctions }),
    clearTableState: () => set({ chain: null, pendingJunctions: [] }),
  },
}))

export const useTableChain = () => useTableMapStore((s) => s.chain)
export const useTablePendingJunctions = () => useTableMapStore((s) => s.pendingJunctions)
export const useTableMapActions = () => useTableMapStore((s) => s.actions)
