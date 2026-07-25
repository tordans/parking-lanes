import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { OsmFeatureRef } from '@osm-editor-kit/osm-map-url'
import { metersPerPixel } from '@osm-editor-kit/osm-maplibre'
import { expandSidepaths } from '@osm-editor-kit/osm-sidepath-tags'
import { useCallback, useEffect, useRef } from 'react'
import type { MapLayerMouseEvent, MapMouseEvent } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import { useFeatureSelection, useSelectedOsmRef } from '../../shell/map/feature-selection'
import { MAIN_MAP_ID } from '../../shell/map/map-ids'
import { useOsmChangeHandler } from '../../shell/map/use-osm-change-handler'
import {
  buildHandleGeometry,
  MIN_WIDTH_M,
  offsetPolylineCoordinates,
  widthDeltaFromScreenDrag,
} from './domain/handle-geometry'
import { roadWidthFromTags } from './domain/road-width-from-tags'
import { highwaysToCollection } from './map/parse-highways'
import { useWidthMapActions, useWidthDragSide, useDraftWidthM } from './map/width-map-store'
import { stageWidthOnSidepath, stageWidthOnWay, roundWidthMetres } from './map/width-osm-edits'
import { useWidthOsmQuery } from './map/width-osm-query'
import { widthInteractiveLayerIds } from './map/WidthLayers'

export { widthInteractiveLayerIds as interactiveLayerIds }

export function useWidthOsmChangeHandler() {
  return useOsmChangeHandler('width')
}

function isSidepathRef(ref: OsmFeatureRef | undefined): ref is OsmFeatureRef & {
  type: 'way'
  prefix: 'cycleway' | 'sidewalk'
  side: 'left' | 'right'
} {
  return (
    ref?.type === 'way' &&
    (ref.prefix === 'cycleway' || ref.prefix === 'sidewalk') &&
    (ref.side === 'left' || ref.side === 'right')
  )
}

function wayCoordinates(
  way: OsmWay,
  nodeCoords: Record<number, number[]> | undefined,
): [number, number][] {
  return way.nodes
    .map((nodeId) => {
      const coord = nodeCoords?.[nodeId]
      if (!coord) return null
      return [coord[1]!, coord[0]!] as [number, number]
    })
    .filter((coord): coord is [number, number] => coord != null)
}

function sidepathWidthFromWay(way: OsmWay, ref: OsmFeatureRef) {
  if (!isSidepathRef(ref)) return null
  const expanded = expandSidepaths(way.id, way.tags)
  const match = expanded.find(
    (entry) => entry.ref.prefix === ref.prefix && entry.ref.side === ref.side,
  )
  if (!match) return null
  return roadWidthFromTags(match.tags)
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

      const coordinates = wayCoordinates(way, graph?.nodeCoords)
      let handleCoordinates = coordinates
      if (isSidepathRef(selectedOsmRef)) {
        const parentWidth = roadWidthFromTags(way.tags).value
        handleCoordinates = offsetPolylineCoordinates(
          coordinates,
          parentWidth / 2,
          selectedOsmRef.side,
        )
      }

      setHandles(buildHandleGeometry(handleCoordinates, clamped))

      if (isSidepathRef(selectedOsmRef)) {
        handleOsmChange(
          stageWidthOnSidepath(way, selectedOsmRef.prefix, selectedOsmRef.side, clamped),
        )
        return
      }

      handleOsmChange(stageWidthOnWay(way, clamped))
    },
    [graph?.nodeCoords, handleOsmChange, selectedOsmRef, setDraftWidthM, setHandles],
  )

  useEffect(
    function syncSelectionDraft() {
      if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
        clearDraft()
        return
      }

      const way = graph?.ways[selectedOsmRef.id]
      if (!way?.tags?.highway) return

      const coordinates = wayCoordinates(way, graph?.nodeCoords)
      if (isSidepathRef(selectedOsmRef)) {
        const sidepathWidth = sidepathWidthFromWay(way, selectedOsmRef)
        if (!sidepathWidth) return

        const parentWidth = roadWidthFromTags(way.tags).value
        const handleCoordinates = offsetPolylineCoordinates(
          coordinates,
          parentWidth / 2,
          selectedOsmRef.side,
        )

        setDraftWidthM(sidepathWidth.value)
        setHandles(buildHandleGeometry(handleCoordinates, sidepathWidth.value))
        return
      }

      const width = roadWidthFromTags(way.tags)
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

      const kind = feature?.properties?.kind as string | undefined
      if (kind === 'sidepath') {
        const prefix = feature?.properties?.prefix as 'cycleway' | 'sidewalk' | undefined
        const side = feature?.properties?.side as 'left' | 'right' | undefined
        if (!prefix || !side) return
        selectFeature({ type: osmType, id: osmId, prefix, side })
        event.originalEvent.stopPropagation()
        return
      }

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

      const currentWidth =
        draftWidthM ??
        (isSidepathRef(selectedOsmRef)
          ? (sidepathWidthFromWay(way, selectedOsmRef)?.value ?? roadWidthFromTags(way.tags).value)
          : roadWidthFromTags(way.tags).value)

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
  features: ReturnType<typeof highwaysToCollection>,
  selectedOsmRef: OsmFeatureRef | undefined,
) {
  if (!selectedOsmRef || selectedOsmRef.type !== 'way') {
    return highwaysToCollection([])
  }

  const feature = features.features.find((entry) => {
    if (entry.properties.kind === 'sidepath') {
      return (
        entry.properties.osmId === selectedOsmRef.id &&
        entry.properties.prefix === selectedOsmRef.prefix &&
        entry.properties.side === selectedOsmRef.side
      )
    }

    return (
      entry.properties.osmId === selectedOsmRef.id &&
      selectedOsmRef.prefix == null &&
      selectedOsmRef.side == null
    )
  })

  return feature ? highwaysToCollection([feature]) : highwaysToCollection([])
}
