import type { Feature, FeatureCollection, Point } from 'geojson'
import { create } from 'zustand'

export type WayCutPreview = {
  lng: number
  lat: number
  segmentIndex: number
}

export type WayCutMarkerProperties = {
  featureId: string
  kind: 'cut-marker' | 'cut-preview'
  color: string
  weight: number
  nodeId?: number
  wayId: number
  osmType: 'node'
  osmId?: number
  isHovered?: boolean
}

export type WayCutMarkerFeature = Feature<Point, WayCutMarkerProperties>
export type WayCutMarkerCollection = FeatureCollection<Point, WayCutMarkerProperties>

function emptyCutMarkers(): WayCutMarkerCollection {
  return { type: 'FeatureCollection', features: [] }
}

interface WayCutStore {
  isCutActive: boolean
  cutMarkers: WayCutMarkerCollection
  hoveredNodeId: number | null
  preview: WayCutPreview | null
  actions: {
    activateCut: (cutMarkers: WayCutMarkerCollection) => void
    setCutMarkers: (cutMarkers: WayCutMarkerCollection) => void
    setHoveredNodeId: (hoveredNodeId: number | null) => void
    setPreview: (preview: WayCutPreview | null) => void
    cancelCut: () => void
  }
}

const useWayCutStore = create<WayCutStore>()((set) => ({
  isCutActive: false,
  cutMarkers: emptyCutMarkers(),
  hoveredNodeId: null,
  preview: null,
  actions: {
    activateCut: (cutMarkers) =>
      set({
        isCutActive: true,
        cutMarkers,
        hoveredNodeId: null,
        preview: null,
      }),
    setCutMarkers: (cutMarkers) => set({ cutMarkers }),
    setHoveredNodeId: (hoveredNodeId) => set({ hoveredNodeId }),
    setPreview: (preview) => set({ preview }),
    cancelCut: () =>
      set({
        isCutActive: false,
        cutMarkers: emptyCutMarkers(),
        hoveredNodeId: null,
        preview: null,
      }),
  },
}))

export const useIsCutActive = () => useWayCutStore((s) => s.isCutActive)
export const useWayCutMarkers = () => useWayCutStore((s) => s.cutMarkers)
export const useWayCutHoveredNodeId = () => useWayCutStore((s) => s.hoveredNodeId)
export const useWayCutPreview = () => useWayCutStore((s) => s.preview)
export const useWayCutActions = () => useWayCutStore((s) => s.actions)
