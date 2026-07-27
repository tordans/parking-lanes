import * as m from '@app/paraglide/messages'
import { create } from 'zustand'

interface MapStore {
  mapLoaded: boolean
  mapTilesLoading: boolean
  osmDataBusy: boolean
  actions: {
    markMapLoaded: () => void
    setMapTilesLoading: (mapTilesLoading: boolean) => void
    setOsmDataBusy: (osmDataBusy: boolean) => void
    resetMapChrome: () => void
  }
}

const initialMapChrome = {
  mapLoaded: false,
  mapTilesLoading: false,
  osmDataBusy: false,
}

const useMapStore = create<MapStore>()((set) => ({
  ...initialMapChrome,
  actions: {
    markMapLoaded: () => set((state) => (state.mapLoaded ? state : { mapLoaded: true })),
    setMapTilesLoading: (mapTilesLoading) =>
      set((state) => (state.mapTilesLoading === mapTilesLoading ? state : { mapTilesLoading })),
    setOsmDataBusy: (osmDataBusy) =>
      set((state) => (state.osmDataBusy === osmDataBusy ? state : { osmDataBusy })),
    resetMapChrome: () => set(initialMapChrome),
  },
}))

export const useMapLoaded = () => useMapStore((state) => state.mapLoaded)

/** Toolbar spinner: initial map load, tile fetches, or OSM data coverage fetch. */
export const useMapChromeBusy = () =>
  useMapStore((state) => !state.mapLoaded || state.mapTilesLoading || state.osmDataBusy)

export function useMapChromeBusyLabel(): string | null {
  const mapLoaded = useMapStore((state) => state.mapLoaded)
  const mapTilesLoading = useMapStore((state) => state.mapTilesLoading)
  const osmDataBusy = useMapStore((state) => state.osmDataBusy)

  if (!mapLoaded || mapTilesLoading) return m.map_loading_map()
  if (osmDataBusy) return m.map_loading_data()
  return null
}

export const useMapActions = () => useMapStore((state) => state.actions)
