import { OsmDataSource } from '@osm-editor-kit/osm-overpass'
import { create } from 'zustand'
import type { LatLngLiteral, MapBounds } from './map/types'

export enum AuthState {
  initial,
  success,
  fail,
}

interface AppStore {
  fetchButtonText: string
  osmDataSource: OsmDataSource
  datetime: Date
  editorMode: boolean
  authState: AuthState
  osmDisplayName: string | null
  mapState?: {
    zoom: number
    center: LatLngLiteral
    bounds: MapBounds
  }
  changesCount: number
  actions: {
    setFetchButtonText: (value: string) => void
    setOsmDataSource: (value: OsmDataSource) => void
    setDatetime: (value: Date) => void
    setEditorMode: (value: boolean) => void
    setAuthState: (value: AuthState) => void
    setOsmDisplayName: (value: string | null) => void
    setMapState: (value: AppStore['mapState']) => void
    setChangesCount: (value: number) => void
  }
}

const useAppStore = create<AppStore>()((set) => ({
  fetchButtonText: 'Fetch parking data',
  osmDataSource: OsmDataSource.OverpassVk,
  datetime: new Date(),
  editorMode: false,
  authState: AuthState.initial,
  osmDisplayName: null,
  changesCount: 0,
  actions: {
    setFetchButtonText: (fetchButtonText) => set({ fetchButtonText }),
    setOsmDataSource: (osmDataSource) => set({ osmDataSource }),
    setDatetime: (datetime) => set({ datetime }),
    setEditorMode: (editorMode) => set({ editorMode }),
    setAuthState: (authState) =>
      set((state) => (state.authState === authState ? state : { authState })),
    setOsmDisplayName: (osmDisplayName) => set({ osmDisplayName }),
    setMapState: (mapState) => set({ mapState }),
    setChangesCount: (changesCount) => set({ changesCount }),
  },
}))

export const useFetchButtonText = () => useAppStore((s) => s.fetchButtonText)
export const useOsmDataSource = () => useAppStore((s) => s.osmDataSource)
export const useDatetime = () => useAppStore((s) => s.datetime)
export const useEditorMode = () => useAppStore((s) => s.editorMode)
export const useAuthState = () => useAppStore((s) => s.authState)
export const useOsmDisplayName = () => useAppStore((s) => s.osmDisplayName)
export const useMapState = () => useAppStore((s) => s.mapState)
export const useChangesCount = () => useAppStore((s) => s.changesCount)
export const useAppActions = () => useAppStore((s) => s.actions)

export { AuthState as AppAuthState }
