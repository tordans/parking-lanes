import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { serializeFeatureParam } from '@osm-editor-kit/osm-map-url'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { create } from 'zustand'
import { serializeMapSearch } from './search-schema'

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
  const navigate = useNavigate({ from: '/$mode' })

  return {
    selectFeature: (ref: OsmFeatureRef) => {
      useFeatureSelectionStore.getState().actions.bumpSelectionEpoch()
      void navigate({
        search: (prev) => ({ ...serializeMapSearch(prev), f: serializeFeatureParam(ref) }),
        replace: true,
      })
    },
    clearSelection: () => {
      void navigate({
        search: (prev) => ({ ...serializeMapSearch(prev), f: undefined }),
        replace: true,
      })
    },
    updateFeatureRef: (ref: OsmFeatureRef) => {
      void navigate({
        search: (prev) => ({ ...serializeMapSearch(prev), f: serializeFeatureParam(ref) }),
        replace: true,
      })
    },
  }
}
