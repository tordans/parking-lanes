import { create } from 'zustand'

type ViewerPovUpdate = {
  bearing?: number | null
  hfov?: number | null
  lngLat?: [number, number] | null
}

type ViewerStore = {
  bearing: number | null
  hfov: number | null
  lngLat: [number, number] | null
  actions: {
    setPov: (partial: ViewerPovUpdate) => void
    reset: () => void
  }
}

const initialState = {
  bearing: null as number | null,
  hfov: null as number | null,
  lngLat: null as [number, number] | null,
}

const useViewerStore = create<ViewerStore>()((set) => ({
  ...initialState,
  actions: {
    setPov: (partial) =>
      set((state) => ({
        bearing: partial.bearing !== undefined ? partial.bearing : state.bearing,
        hfov: partial.hfov !== undefined ? partial.hfov : state.hfov,
        lngLat: partial.lngLat !== undefined ? partial.lngLat : state.lngLat,
      })),
    reset: () => set(initialState),
  },
}))

export const useViewerBearing = () => useViewerStore((state) => state.bearing)

export const useViewerHfov = () => useViewerStore((state) => state.hfov)

export const useViewerLngLat = () => useViewerStore((state) => state.lngLat)

export const useViewerActions = () => useViewerStore((state) => state.actions)
