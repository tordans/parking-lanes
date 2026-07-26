import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { LaneDirection, LaneSlot, WayLaneModel } from '@osm-editor-kit/osm-lanes'
import {
  addLaneSlot,
  editableLaneDirections,
  parseWayLanes,
  removeLaneSlot,
  slotHasRichData,
  validateWayLanes,
} from '@osm-editor-kit/osm-lanes'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useCallback } from 'react'
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { useFeatureSelection } from '../../shell/map/feature-selection'
import { useOsmChangeHandler } from '../../shell/map/use-osm-change-handler'
import { commitLaneModelToWay } from './domain/lanes-edits'
import { useLanesMapActions } from './map/lanes-map-store'
import { lanesInteractiveLayerIds } from './map/LanesLayers'

export { lanesInteractiveLayerIds as interactiveLayerIds }

export function useLanesOsmChangeHandler() {
  return useOsmChangeHandler('lanes')
}

function finalizeLaneModel(model: WayLaneModel, baseTags: Record<string, string>): WayLaneModel {
  return {
    ...model,
    warnings: validateWayLanes(model, baseTags),
  }
}

export function useLanesModeHandlers() {
  const { selectFeature, clearSelection } = useFeatureSelection()
  const { clearLanesState, selectSlot } = useLanesMapActions()
  const handleOsmChange = useLanesOsmChangeHandler()

  const commitLaneModel = useCallback(
    (way: OsmWay, model: WayLaneModel) => {
      const nextModel = finalizeLaneModel(model, way.tags)
      handleOsmChange(commitLaneModelToWay(way, nextModel))
    },
    [handleOsmChange],
  )

  const commitSlotUpdate = useCallback(
    (way: OsmWay, updater: (slots: LaneSlot[]) => LaneSlot[]) => {
      const model = parseWayLanes(way.tags)
      const nextSlots = updater(model.slots)
      commitLaneModel(way, { ...model, slots: nextSlots })
    },
    [commitLaneModel],
  )

  const addLane = useCallback(
    (way: OsmWay, direction: LaneDirection) => {
      const model = parseWayLanes(way.tags)
      commitLaneModel(way, addLaneSlot(model, direction))
    },
    [commitLaneModel],
  )

  const removeLane = useCallback(
    (way: OsmWay, direction: LaneDirection, index: number, slot: LaneSlot) => {
      if (slotHasRichData(slot)) {
        const confirmed = window.confirm('This lane has turn or access tags. Remove it anyway?')
        if (!confirmed) return false
      }

      const model = parseWayLanes(way.tags)
      const next = removeLaneSlot(model, direction, index)
      if (!next) return false

      commitLaneModel(way, next)
      selectSlot(null)
      return true
    },
    [commitLaneModel, selectSlot],
  )

  const handleLayerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      const osmId = feature?.properties?.osmId as number | undefined
      const osmType = feature?.properties?.osmType as OsmFeatureRef['type'] | undefined
      if (!osmId || osmType !== 'way') return

      selectFeature({ type: 'way', id: osmId })
      event.originalEvent.stopPropagation()
    },
    [selectFeature],
  )

  const handleMapClick = useCallback(() => {
    clearSelection()
    clearLanesState()
  }, [clearLanesState, clearSelection])

  return {
    handleLayerClick,
    handleMapClick,
    commitSlotUpdate,
    commitLaneModel,
    addLane,
    removeLane,
    editableLaneDirections,
  }
}
