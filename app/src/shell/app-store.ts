import type { MapBounds } from '@osm-editor-kit/osm-data'
import { create } from 'zustand'
import type { StreetSpaceModeId } from '../modes/types'

export enum AuthState {
  initial,
  success,
  fail,
}

interface AppStore {
  datetime: Date
  activeMode: StreetSpaceModeId
  authState: AuthState
  osmDisplayName: string | null
  /** Viewport bounds from the map (not serialized in URL). Zoom/center live in router `map` search. */
  mapBounds?: MapBounds
  changesCount: number
  actions: {
    setDatetime: (value: Date) => void
    setActiveMode: (value: StreetSpaceModeId) => void
    setAuthState: (value: AuthState) => void
    setOsmDisplayName: (value: string | null) => void
    setMapBounds: (value: MapBounds) => void
    setChangesCount: (value: number) => void
  }
}

const useAppStore = create<AppStore>()((set) => ({
  datetime: new Date(),
  activeMode: 'parking',
  authState: AuthState.initial,
  osmDisplayName: null,
  changesCount: 0,
  actions: {
    setDatetime: (datetime) => set({ datetime }),
    setActiveMode: (activeMode) => set({ activeMode }),
    setAuthState: (authState) =>
      set((state) => (state.authState === authState ? state : { authState })),
    setOsmDisplayName: (osmDisplayName) => set({ osmDisplayName }),
    setMapBounds: (mapBounds) => set({ mapBounds }),
    setChangesCount: (changesCount) => set({ changesCount }),
  },
}))

export const useDatetime = () => useAppStore((s) => s.datetime)
export const useActiveMode = () => useAppStore((s) => s.activeMode)
export const useAuthState = () => useAppStore((s) => s.authState)
export const useOsmDisplayName = () => useAppStore((s) => s.osmDisplayName)
export const useMapBounds = () => useAppStore((s) => s.mapBounds)
export const useChangesCount = () => useAppStore((s) => s.changesCount)
export const useAppActions = () => useAppStore((s) => s.actions)

export { AuthState as AppAuthState }
