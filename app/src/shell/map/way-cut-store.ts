import type { Feature, FeatureCollection, Point } from 'geojson'
import { create } from 'zustand'

export type WayCutMarkerProperties = {
  featureId: string
  kind: 'cut-marker'
  color: string
  weight: number
  nodeId: number
  wayId: number
  osmType: 'node'
  osmId: number
}

export type WayCutMarkerFeature = Feature<Point, WayCutMarkerProperties>
export type WayCutMarkerCollection = FeatureCollection<Point, WayCutMarkerProperties>

function emptyCutMarkers(): WayCutMarkerCollection {
  return { type: 'FeatureCollection', features: [] }
}

interface WayCutStore {
  cutMarkers: WayCutMarkerCollection
  actions: {
    setCutMarkers: (cutMarkers: WayCutMarkerCollection) => void
    clearCutMarkers: () => void
  }
}

const useWayCutStore = create<WayCutStore>()((set) => ({
  cutMarkers: emptyCutMarkers(),
  actions: {
    setCutMarkers: (cutMarkers) => set({ cutMarkers }),
    clearCutMarkers: () => set({ cutMarkers: emptyCutMarkers() }),
  },
}))

export const useWayCutMarkers = () => useWayCutStore((s) => s.cutMarkers)
export const useWayCutActions = () => useWayCutStore((s) => s.actions)
