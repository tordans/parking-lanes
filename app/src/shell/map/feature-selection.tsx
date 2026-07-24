import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { serializeFeatureParam } from '@osm-editor-kit/osm-map-url'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useParkingMapActions } from '../../modes/parking'
import { serializeMapSearch } from './search-schema'

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
  const { f } = useSearch({ from: '/' })
  const mapActions = useParkingMapActions()
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
    mapActions.clearBacklights()
    void navigate({
      search: (prev) => ({ ...serializeMapSearch(prev), f: undefined }),
      replace: true,
    })
  }, [mapActions, navigate])

  const updateFeatureRef = useCallback(
    (ref: OsmFeatureRef) => {
      void navigate({
        search: (prev) => ({ ...serializeMapSearch(prev), f: serializeFeatureParam(ref) }),
        replace: true,
      })
    },
    [navigate],
  )

  useEffect(() => {
    if (!f) {
      mapActions.clearBacklights()
      mapActions.setSelectedOsmRef(null)
      return
    }

    mapActions.setSelectedOsmRef(f)
  }, [f, mapActions])

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
