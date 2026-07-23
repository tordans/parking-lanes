import { create } from 'zustand'
import type { OsmObject, OsmWay } from '../../utils/types/osm-data'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

interface ParkingMapStore {
  lanes: ParkingFeatureCollection
  areas: ParkingFeatureCollection
  points: ParkingFeatureCollection
  backlights: ParkingFeatureCollection
  cutMarkers: ParkingFeatureCollection
  selectedOsmObject: OsmObject | null
  actions: {
    setLanes: (lanes: ParkingFeatureCollection) => void
    addLanes: (lanes: ParkingFeature[]) => void
    setAreas: (areas: ParkingFeatureCollection) => void
    addAreas: (areas: ParkingFeature[]) => void
    setPoints: (points: ParkingFeatureCollection) => void
    addPoints: (points: ParkingFeature[]) => void
    setBacklights: (backlights: ParkingFeatureCollection) => void
    clearBacklights: () => void
    setCutMarkers: (markers: ParkingFeatureCollection) => void
    clearCutMarkers: () => void
    setSelectedOsmObject: (osm: OsmObject | null) => void
    removeEmptyLanes: () => void
    updateLaneFeatures: (features: ParkingFeature[]) => void
  }
}

const emptyCollection = (): ParkingFeatureCollection => ({
  type: 'FeatureCollection',
  features: [],
})

function mergeFeatures(
  existing: ParkingFeatureCollection,
  incoming: ParkingFeature[],
): ParkingFeatureCollection {
  const byId = new Map(existing.features.map((f) => [f.properties.featureId, f]))
  for (const feature of incoming) byId.set(feature.properties.featureId, feature)
  return { type: 'FeatureCollection', features: [...byId.values()] }
}

const useParkingMapStore = create<ParkingMapStore>()((set, get) => ({
  lanes: emptyCollection(),
  areas: emptyCollection(),
  points: emptyCollection(),
  backlights: emptyCollection(),
  cutMarkers: emptyCollection(),
  selectedOsmObject: null,
  actions: {
    setLanes: (lanes) => set({ lanes }),
    addLanes: (lanes) => set({ lanes: mergeFeatures(get().lanes, lanes) }),
    setAreas: (areas) => set({ areas }),
    addAreas: (areas) => set({ areas: mergeFeatures(get().areas, areas) }),
    setPoints: (points) => set({ points }),
    addPoints: (points) => set({ points: mergeFeatures(get().points, points) }),
    setBacklights: (backlights) => set({ backlights }),
    clearBacklights: () => set({ backlights: emptyCollection() }),
    setCutMarkers: (cutMarkers) => set({ cutMarkers }),
    clearCutMarkers: () => set({ cutMarkers: emptyCollection() }),
    setSelectedOsmObject: (selectedOsmObject) => set({ selectedOsmObject }),
    removeEmptyLanes: () =>
      set({
        lanes: {
          type: 'FeatureCollection',
          features: get().lanes.features.filter((f) => !f.properties.featureId.startsWith('empty')),
        },
      }),
    updateLaneFeatures: (features) => set({ lanes: { type: 'FeatureCollection', features } }),
  },
}))

export const getParkingMapState = () => useParkingMapStore.getState()

export const useLaneFeatures = () => useParkingMapStore((s) => s.lanes)
export const useAreaFeatures = () => useParkingMapStore((s) => s.areas)
export const usePointFeatures = () => useParkingMapStore((s) => s.points)
export const useBacklightFeatures = () => useParkingMapStore((s) => s.backlights)
export const useCutMarkerFeatures = () => useParkingMapStore((s) => s.cutMarkers)
export const useSelectedOsmObject = () => useParkingMapStore((s) => s.selectedOsmObject)
export const useParkingMapActions = () => useParkingMapStore((s) => s.actions)

export function getLaneFeatureByOsmId(
  osmId: number,
  lanes: ParkingFeatureCollection,
): ParkingFeature | undefined {
  return (
    lanes.features.find((f) => f.properties.featureId === 'right' + osmId) ??
    lanes.features.find((f) => f.properties.featureId === 'left' + osmId) ??
    lanes.features.find((f) => f.properties.featureId === 'empty' + osmId)
  )
}

export function getWayFromFeature(
  feature: ParkingFeature,
  ways: Record<number, OsmWay>,
): OsmWay | undefined {
  return ways[feature.properties.osmId]
}
