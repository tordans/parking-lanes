import type { MapBounds } from '@osm-editor-kit/osm-data'
import { create } from 'zustand'

export enum AuthState {
  initial,
  success,
  fail,
}

interface AppStore {
  datetime: Date
  authState: AuthState
  osmDisplayName: string | null
  /** Viewport bounds from the map (not serialized in URL). Zoom/center live in router `map` search. */
  mapBounds?: MapBounds
  actions: {
    setDatetime: (value: Date) => void
    setAuthState: (value: AuthState) => void
    setOsmDisplayName: (value: string | null) => void
    setMapBounds: (value: MapBounds) => void
  }
}

const useAppStore = create<AppStore>()((set) => ({
  datetime: new Date(),
  authState: AuthState.initial,
  osmDisplayName: null,
  actions: {
    setDatetime: (datetime) => set({ datetime }),
    setAuthState: (authState) =>
      set((state) => (state.authState === authState ? state : { authState })),
    setOsmDisplayName: (osmDisplayName) => set({ osmDisplayName }),
    setMapBounds: (mapBounds) => set({ mapBounds }),
  },
}))

export const useDatetime = () => useAppStore((s) => s.datetime)
export const useAuthState = () => useAppStore((s) => s.authState)
export const useOsmDisplayName = () => useAppStore((s) => s.osmDisplayName)
export const useMapBounds = () => useAppStore((s) => s.mapBounds)
export const useAppActions = () => useAppStore((s) => s.actions)

export { AuthState as AppAuthState }
