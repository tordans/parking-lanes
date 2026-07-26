import { create } from 'zustand'

interface BackgroundHistoryStore {
  /** Previous ELI slug, or `null` for default OpenFreeMap. `undefined` = no history yet. */
  previousId: string | null | undefined
  actions: {
    rememberPrevious: (id: string | null) => void
  }
}

const useBackgroundHistoryStore = create<BackgroundHistoryStore>()((set) => ({
  previousId: undefined,
  actions: {
    rememberPrevious: (previousId) => set({ previousId }),
  },
}))

export const usePreviousBackgroundLayerId = () =>
  useBackgroundHistoryStore((state) => state.previousId)

export const useBackgroundHistoryActions = () => useBackgroundHistoryStore((state) => state.actions)
