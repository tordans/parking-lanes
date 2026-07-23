import { useEffect } from 'react'
import { osmData } from '../../utils/data-client'
import type { OsmWay } from '../../utils/types/osm-data'
import { useDatetime } from '../app-store'
import { getParkingMapState } from './parking-map-store'
import {
  updateAreaFeatureColors,
  updatePointFeatureColors,
  updatePointFeatureStyles,
} from './parse-areas-points'
import { updateLaneFeatureColors, updateLaneFeatureStyles } from './parse-lanes'
import type { ParkingFeature } from './types'

function parkingFeatureVisualsChanged(prev: ParkingFeature[], next: ParkingFeature[]): boolean {
  if (prev.length !== next.length) return true
  for (let i = 0; i < prev.length; i++) {
    if (
      prev[i]!.properties.color !== next[i]!.properties.color ||
      prev[i]!.properties.weight !== next[i]!.properties.weight
    ) {
      return true
    }
  }
  return false
}

function buildOsmTagMaps() {
  const wayTags: Record<number, OsmWay['tags']> = {}
  for (const way of Object.values(osmData.ways)) wayTags[way.id] = way.tags

  const nodeTags: Record<number, OsmWay['tags']> = {}
  for (const node of Object.values(osmData.nodes)) nodeTags[node.id] = node.tags

  const relationTags: Record<number, OsmWay['tags']> = {}
  for (const relation of Object.values(osmData.relations)) relationTags[relation.id] = relation.tags

  return { wayTags, nodeTags, relationTags }
}

export function syncDatetimeColors(datetime: Date) {
  const { lanes, areas, points, actions } = getParkingMapState()
  const { wayTags, nodeTags, relationTags } = buildOsmTagMaps()

  const updatedLanes = updateLaneFeatureColors(lanes.features, datetime, wayTags)
  if (parkingFeatureVisualsChanged(lanes.features, updatedLanes)) {
    actions.updateLaneFeatures(updatedLanes)
  }

  const updatedAreas = updateAreaFeatureColors(areas.features, datetime, wayTags, relationTags)
  if (parkingFeatureVisualsChanged(areas.features, updatedAreas)) {
    actions.setAreas({ type: 'FeatureCollection', features: updatedAreas })
  }

  const updatedPoints = updatePointFeatureColors(points.features, datetime, nodeTags)
  if (parkingFeatureVisualsChanged(points.features, updatedPoints)) {
    actions.setPoints({ type: 'FeatureCollection', features: updatedPoints })
  }
}

export function syncZoomStyles(zoom: number) {
  const { lanes, points, actions } = getParkingMapState()

  const updatedLanes = updateLaneFeatureStyles(lanes.features, zoom)
  if (parkingFeatureVisualsChanged(lanes.features, updatedLanes)) {
    actions.updateLaneFeatures(updatedLanes)
  }

  const updatedPoints = updatePointFeatureStyles(points.features, zoom)
  if (parkingFeatureVisualsChanged(points.features, updatedPoints)) {
    actions.setPoints({ type: 'FeatureCollection', features: updatedPoints })
  }
}

export function useDatetimeColorSync() {
  const datetime = useDatetime()
  useEffect(
    function syncDatetimeColorsEffect() {
      syncDatetimeColors(datetime)
    },
    [datetime],
  )
}

export function useZoomStyleSync(zoom: number) {
  useEffect(
    function syncZoomStylesEffect() {
      syncZoomStyles(zoom)
    },
    [zoom],
  )
}
