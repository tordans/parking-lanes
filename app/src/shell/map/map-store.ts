import { create } from 'zustand'

interface MapStore {
  mapLoaded: boolean
  actions: {
    markMapLoaded: () => void
  }
}

const useMapStore = create<MapStore>()((set) => ({
  mapLoaded: false,
  actions: {
    markMapLoaded: () => set((state) => (state.mapLoaded ? state : { mapLoaded: true })),
  },
}))

export const useMapLoaded = () => useMapStore((state) => state.mapLoaded)
export const useMapActions = () => useMapStore((state) => state.actions)
