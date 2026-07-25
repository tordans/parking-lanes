import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import type { MapLayerMouseEvent, MapMouseEvent } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import { AuthState, useAppActions, useAuthState } from '../../shell/app-store'
import { useFeatureSelection, useSelectedOsmRef } from '../../shell/map/feature-selection'
import { MAIN_MAP_ID } from '../../shell/map/map-ids'
import { getOsmWayFromSession } from '../../shell/map/osm-session-way-edits'
import { addChangedEntity } from '../../utils/changes-store'
import {
  buildHandleGeometry,
  MIN_WIDTH_M,
  widthDeltaFromScreenDrag,
} from './domain/handle-geometry'
import { metersPerPixel } from './domain/meters-to-pixels'
import { roadWidthFromTags } from './domain/road-width-from-tags'
import { highwaysToCollection } from './map/parse-highways'
import { useWidthMapActions, useWidthDragSide, useDraftWidthM } from './map/width-map-store'
import { stageWidthOnWay, updateWidthOsmWay, roundWidthMetres } from './map/width-osm-edits'
import { useWidthOsmQuery } from './map/width-osm-query'
import { widthInteractiveLayerIds } from './map/WidthLayers'

export { widthInteractiveLayerIds as interactiveLayerIds }

export function useWidthOsmChangeHandler() {
  const queryClient = useQueryClient()
  const authState = useAuthState()
  const { setChangesCount } = useAppActions()

  return useCallback(
    (newOsm: OsmWay) => {
      if (authState !== AuthState.success) return
      const original = getOsmWayFromSession(queryClient, newOsm.id)
      updateWidthOsmWay(queryClient, newOsm)
      const changesCount = addChangedEntity(newOsm, { original, source: 'width' })
      setChangesCount(changesCount)
    },
    [authState, queryClient, setChangesCount],
  )
}

export function useWidthModeHandlers() {
  const { selectFeature, clearSelection } = useFeatureSelection()
  const selectedOsmRef = useSelectedOsmRef()
  const { data: graph } = useWidthOsmQuery({ select: (data) => data.graph })
  const { setDraftWidthM, setHandles, startDrag, endDrag, clearDraft } = useWidthMapActions()
  const dragSide = useWidthDragSide()
  const draftWidthM = useDraftWidthM()
  const handleOsmChange = useWidthOsmChangeHandler()
  const maps = useMap()
  const mainMap = maps[MAIN_MAP_ID]
  const dragRef = useRef<{
    side: 'left' | 'right'
    startWidthM: number
    startClientY: number
    startClientX: number
    bearing: number
  } | null>(null)

  const applyWidth = useCallback(
    (way: OsmWay, widthM: number) => {
      const clamped = Math.max(MIN_WIDTH_M, roundWidthMetres(widthM))
      setDraftWidthM(clamped)
      const geometry = buildHandleGeometry(
        way.nodes
          .map((nodeId) => {
            const coord = graph?.nodeCoords[nodeId]
            if (!coord) return null
            return [coord[1]!, coord[0]!] as [number, number]
          })
          .filter((coord): coord is [number, number] => coord != null),
        clamped,
      )
      setHandles(geometry)
      handleOsmChange(stageWidthOnWay(way, clamped))
    },
    [graph?.nodeCoords, handleOsmChange, setDraftWidthM, setHandles],
  )

  useEffect(
    function syncSelectionDraft() {
      if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
        clearDraft()
        return
      }

      const way = graph?.ways[selectedOsmRef.id]
      if (!way?.tags?.highway) return

      const width = roadWidthFromTags(way.tags)
      const coordinates = way.nodes
        .map((nodeId) => {
          const coord = graph?.nodeCoords[nodeId]
          if (!coord) return null
          return [coord[1]!, coord[0]!] as [number, number]
        })
        .filter((coord): coord is [number, number] => coord != null)

      setDraftWidthM(width.value)
      setHandles(buildHandleGeometry(coordinates, width.value))
    },
    [clearDraft, graph?.nodeCoords, graph?.ways, selectedOsmRef, setDraftWidthM, setHandles],
  )

  const handleLayerClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const layerId = event.features?.[0]?.layer?.id
      if (layerId === 'width-handles-hitarea-layer') {
        event.originalEvent.stopPropagation()
        return
      }

      const feature = event.features?.[0]
      const osmId = feature?.properties?.osmId as number | undefined
      const osmType = feature?.properties?.osmType as OsmFeatureRef['type'] | undefined
      if (!osmId || !osmType) return

      selectFeature({ type: osmType, id: osmId })
      event.originalEvent.stopPropagation()
    },
    [selectFeature],
  )

  const handleMapClick = useCallback(() => {
    if (dragSide) return
    clearSelection()
    clearDraft()
  }, [clearDraft, clearSelection, dragSide])

  const handleMouseDown = useCallback(
    (event: MapLayerMouseEvent) => {
      const layerId = event.features?.[0]?.layer?.id
      if (layerId !== 'width-handles-hitarea-layer') return

      const props = event.features?.[0]?.properties as
        | { side?: 'left' | 'right'; alongBearing?: number }
        | undefined
      const side = props?.side
      const alongBearing = props?.alongBearing
      const wayId = selectedOsmRef?.type === 'way' ? selectedOsmRef.id : null
      const way = wayId ? graph?.ways[wayId] : undefined
      if (!side || alongBearing == null || !Number.isFinite(alongBearing) || !way) return

      const currentWidth = draftWidthM ?? roadWidthFromTags(way.tags).value

      dragRef.current = {
        side,
        startWidthM: currentWidth,
        startClientX: event.originalEvent.clientX,
        startClientY: event.originalEvent.clientY,
        bearing: alongBearing,
      }
      startDrag(side, currentWidth)
      event.preventDefault()
    },
    [draftWidthM, graph?.ways, selectedOsmRef, startDrag],
  )

  const handleMouseMove = useCallback(
    (event: MapMouseEvent) => {
      if (!dragRef.current || !selectedOsmRef || selectedOsmRef.type !== 'way') return

      const way = graph?.ways[selectedOsmRef.id]
      const map = mainMap?.getMap()
      if (!way || !map) return

      const { startWidthM, startClientX, startClientY, side, bearing } = dragRef.current
      const deltaX = event.originalEvent.clientX - startClientX
      const deltaY = event.originalEvent.clientY - startClientY

      const widthDeltaM = widthDeltaFromScreenDrag({
        deltaX,
        deltaY,
        side,
        alongBearing: bearing,
        mapBearing: map.getBearing(),
        metersPerPixel: metersPerPixel(map.getZoom(), map.getCenter().lat),
      })
      const nextWidth = Math.max(MIN_WIDTH_M, startWidthM + widthDeltaM)

      applyWidth(way, nextWidth)
    },
    [applyWidth, graph?.ways, mainMap, selectedOsmRef],
  )

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
    endDrag()
  }, [endDrag])

  return {
    handleLayerClick,
    handleMapClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    applyWidth,
  }
}

export function selectedWidthCenterline(
  highways: ReturnType<typeof highwaysToCollection>,
  selectedOsmRef: OsmFeatureRef | undefined,
) {
  if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
    return highwaysToCollection([])
  }

  const feature = highways.features.find((f) => f.properties.osmId === selectedOsmRef.id)
  return feature ? highwaysToCollection([feature]) : highwaysToCollection([])
}
