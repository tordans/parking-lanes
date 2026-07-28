import type { OsmWay } from '@osm-editor-kit/osm-data'
import { create } from 'zustand'
import type { ParkingFeature, ParkingFeatureCollection } from './types'

export type ParkingSelectedSideMode = 'both' | 'split'

interface ParkingMapStore {
  backlights: ParkingFeatureCollection
  /** Follows the parking editor left/right vs both switcher for selection chrome. */
  selectedSideMode: ParkingSelectedSideMode | null
  actions: {
    setBacklights: (backlights: ParkingFeatureCollection) => void
    clearBacklights: () => void
    setSelectedSideMode: (mode: ParkingSelectedSideMode | null) => void
  }
}

const emptyCollection = (): ParkingFeatureCollection => ({
  type: 'FeatureCollection',
  features: [],
})

const useParkingMapStore = create<ParkingMapStore>()((set) => ({
  backlights: emptyCollection(),
  selectedSideMode: null,
  actions: {
    setBacklights: (backlights) => set({ backlights }),
    clearBacklights: () => set({ backlights: emptyCollection() }),
    setSelectedSideMode: (selectedSideMode) => set({ selectedSideMode }),
  },
}))

export const useBacklightFeatures = () => useParkingMapStore((s) => s.backlights)
export const useSelectedSideMode = () => useParkingMapStore((s) => s.selectedSideMode)
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

/** Paint both geometric sides black when the editor is in both mode. */
export function withBothSideChrome(collection: ParkingFeatureCollection): ParkingFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collection.features.map((feature) => ({
      ...feature,
      properties: { ...feature.properties, side: 'both' as const },
    })),
  }
}
