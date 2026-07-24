import { create } from 'zustand'

interface DebugSettingsStore {
  /** Use OSM dev API (api06.dev.openstreetmap.org) instead of production. */
  useOsmDevServer: boolean
  actions: {
    setUseOsmDevServer: (enabled: boolean) => void
  }
}

const useDebugSettingsStore = create<DebugSettingsStore>()((set) => ({
  useOsmDevServer: false,
  actions: {
    setUseOsmDevServer: (useOsmDevServer) =>
      set((state) => (state.useOsmDevServer === useOsmDevServer ? state : { useOsmDevServer })),
  },
}))

export const useUseOsmDevServer = () => useDebugSettingsStore((state) => state.useOsmDevServer)

export const useDebugSettingsActions = () => useDebugSettingsStore((state) => state.actions)

export function getUseOsmDevServer(): boolean {
  return useDebugSettingsStore.getState().useOsmDevServer
}
