import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DebugSettingsStore {
  /** Use OSM dev API (master.apis.dev.openstreetmap.org) instead of production. */
  useOsmDevServer: boolean
  actions: {
    setUseOsmDevServer: (enabled: boolean) => void
  }
}

const useDebugSettingsStore = create<DebugSettingsStore>()(
  persist(
    (set) => ({
      useOsmDevServer: false,
      actions: {
        setUseOsmDevServer: (useOsmDevServer) =>
          set((state) => (state.useOsmDevServer === useOsmDevServer ? state : { useOsmDevServer })),
      },
    }),
    {
      name: 'street-space-debug-settings',
      partialize: (state) => ({ useOsmDevServer: state.useOsmDevServer }),
    },
  ),
)

export const useUseOsmDevServer = () => useDebugSettingsStore((state) => state.useOsmDevServer)

export const useDebugSettingsActions = () => useDebugSettingsStore((state) => state.actions)

export function getUseOsmDevServer(): boolean {
  return useDebugSettingsStore.getState().useOsmDevServer
}

const DEBUG_SETTINGS_STORAGE_KEY = 'street-space-debug-settings'

/** Read persisted dev-server toggle synchronously (before Zustand rehydration). */
export function readUseOsmDevServerFromStorage(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    const raw = localStorage.getItem(DEBUG_SETTINGS_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { state?: { useOsmDevServer?: boolean } }
    return parsed.state?.useOsmDevServer === true
  } catch {
    return false
  }
}
