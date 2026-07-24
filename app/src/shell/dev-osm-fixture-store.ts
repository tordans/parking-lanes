import { create } from 'zustand'

interface DevOsmFixtureStore {
  /** When true, DEV uses normal viewport OSM fetches instead of the local fixture. */
  liveViewportOsmFetch: boolean
  actions: {
    setLiveViewportOsmFetch: (enabled: boolean) => void
  }
}

const useDevOsmFixtureStore = create<DevOsmFixtureStore>()((set) => ({
  liveViewportOsmFetch: false,
  actions: {
    setLiveViewportOsmFetch: (liveViewportOsmFetch) =>
      set((state) =>
        state.liveViewportOsmFetch === liveViewportOsmFetch ? state : { liveViewportOsmFetch },
      ),
  },
}))

export const useLiveViewportOsmFetch = () =>
  useDevOsmFixtureStore((state) => state.liveViewportOsmFetch)

export const useDevOsmFixtureActions = () => useDevOsmFixtureStore((state) => state.actions)

/** DEV + fixture mode (not live viewport fetch). Always false in production builds. */
export function isDevOsmFixtureActive(): boolean {
  return import.meta.env.DEV && !useDevOsmFixtureStore.getState().liveViewportOsmFetch
}
