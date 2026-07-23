import { create } from 'zustand'
import { OsmDataSource } from '../utils/types/osm-data'
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
  changesCount: 0,
  actions: {
    setFetchButtonText: (fetchButtonText) => set({ fetchButtonText }),
    setOsmDataSource: (osmDataSource) => set({ osmDataSource }),
    setDatetime: (datetime) => set({ datetime }),
    setEditorMode: (editorMode) => set({ editorMode }),
    setAuthState: (authState) =>
      set((state) => (state.authState === authState ? state : { authState })),
    setMapState: (mapState) => set({ mapState }),
    setChangesCount: (changesCount) => set({ changesCount }),
  },
}))

export const useFetchButtonText = () => useAppStore((s) => s.fetchButtonText)
export const useOsmDataSource = () => useAppStore((s) => s.osmDataSource)
export const useDatetime = () => useAppStore((s) => s.datetime)
export const useEditorMode = () => useAppStore((s) => s.editorMode)
export const useAuthState = () => useAppStore((s) => s.authState)
export const useMapState = () => useAppStore((s) => s.mapState)
export const useChangesCount = () => useAppStore((s) => s.changesCount)
export const useAppActions = () => useAppStore((s) => s.actions)

export { AuthState as AppAuthState }
