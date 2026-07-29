import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useSearch } from '@tanstack/react-router'
import { create } from 'zustand'
import { useModeSearchNavigation } from './use-mode-search-navigation'

/** Selected OSM feature from URL search (`f` param) — single source of truth. */
export function useSelectedOsmRef(): OsmFeatureRef | undefined {
  const { f } = useSearch({ from: '/$mode' })
  return f
}

interface FeatureSelectionStore {
  /** Increments on each map-driven selectFeature call (including same id). */
  selectionEpoch: number
  actions: {
    bumpSelectionEpoch: () => void
  }
}

const useFeatureSelectionStore = create<FeatureSelectionStore>()((set) => ({
  selectionEpoch: 0,
  actions: {
    bumpSelectionEpoch: () => set((state) => ({ selectionEpoch: state.selectionEpoch + 1 })),
  },
}))

export const useSelectionEpoch = () => useFeatureSelectionStore((state) => state.selectionEpoch)

/** URL navigation helpers + epoch bump for map-driven selection. */
export function useFeatureSelectionActions() {
  const { updateSearch } = useModeSearchNavigation()

  return {
    selectFeature: (ref: OsmFeatureRef) => {
      useFeatureSelectionStore.getState().actions.bumpSelectionEpoch()
      updateSearch({ f: ref }, { replace: true })
    },
    clearSelection: () => {
      updateSearch({ f: undefined }, { replace: true })
    },
    updateFeatureRef: (ref: OsmFeatureRef) => {
      updateSearch({ f: ref }, { replace: true })
    },
  }
}
