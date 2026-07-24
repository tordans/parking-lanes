import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { serializeFeatureParam } from '@osm-editor-kit/osm-map-url'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { serializeMapSearch } from './search-schema'

/** Selected OSM feature from URL search (`f` param) — single source of truth. */
export function useSelectedOsmRef(): OsmFeatureRef | undefined {
  const { f } = useSearch({ from: '/' })
  return f
}

type FeatureSelectionContextValue = {
  selectFeature: (ref: OsmFeatureRef) => void
  clearSelection: () => void
  updateFeatureRef: (ref: OsmFeatureRef) => void
  /** Increments on each map-driven selectFeature call (including same id). */
  selectionEpoch: number
}

const FeatureSelectionContext = createContext<FeatureSelectionContextValue | null>(null)

export function FeatureSelectionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate({ from: '/' })
  const [selectionEpoch, setSelectionEpoch] = useState(0)

  const selectFeature = useCallback(
    (ref: OsmFeatureRef) => {
      setSelectionEpoch((epoch) => epoch + 1)
      void navigate({
        search: (prev) => ({ ...serializeMapSearch(prev), f: serializeFeatureParam(ref) }),
        replace: true,
      })
    },
    [navigate],
  )

  const clearSelection = useCallback(() => {
    void navigate({
      search: (prev) => ({ ...serializeMapSearch(prev), f: undefined }),
      replace: true,
    })
  }, [navigate])

  const updateFeatureRef = useCallback(
    (ref: OsmFeatureRef) => {
      void navigate({
        search: (prev) => ({ ...serializeMapSearch(prev), f: serializeFeatureParam(ref) }),
        replace: true,
      })
    },
    [navigate],
  )

  return (
    <FeatureSelectionContext.Provider
      value={{ selectFeature, clearSelection, updateFeatureRef, selectionEpoch }}
    >
      {children}
    </FeatureSelectionContext.Provider>
  )
}

export function useFeatureSelection() {
  const context = useContext(FeatureSelectionContext)
  if (!context) {
    throw new Error('useFeatureSelection must be used within FeatureSelectionProvider')
  }
  return context
}
