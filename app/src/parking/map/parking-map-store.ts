import { create } from 'zustand'
import type { OsmWay } from '../../utils/types/osm-data'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

interface ParkingMapStore {
  backlights: ParkingFeatureCollection
  cutMarkers: ParkingFeatureCollection
  selectedOsmId: number | null
  actions: {
    setBacklights: (backlights: ParkingFeatureCollection) => void
    clearBacklights: () => void
    setCutMarkers: (markers: ParkingFeatureCollection) => void
    clearCutMarkers: () => void
    setSelectedOsmId: (osmId: number | null) => void
  }
}

const emptyCollection = (): ParkingFeatureCollection => ({
  type: 'FeatureCollection',
  features: [],
})

const useParkingMapStore = create<ParkingMapStore>()((set) => ({
  backlights: emptyCollection(),
  cutMarkers: emptyCollection(),
  selectedOsmId: null,
  actions: {
    setBacklights: (backlights) => set({ backlights }),
    clearBacklights: () => set({ backlights: emptyCollection() }),
    setCutMarkers: (cutMarkers) => set({ cutMarkers }),
    clearCutMarkers: () => set({ cutMarkers: emptyCollection() }),
    setSelectedOsmId: (selectedOsmId) => set({ selectedOsmId }),
  },
}))

export const useBacklightFeatures = () => useParkingMapStore((s) => s.backlights)
export const useCutMarkerFeatures = () => useParkingMapStore((s) => s.cutMarkers)
export const useSelectedOsmId = () => useParkingMapStore((s) => s.selectedOsmId)
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
