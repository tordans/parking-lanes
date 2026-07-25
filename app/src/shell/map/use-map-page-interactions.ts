import { useParams, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import type { MapLayerMouseEvent, MapMouseEvent } from 'react-map-gl/maplibre'
import {
  useParkingLayerClickHandler,
  useParkingMapClickHandler,
} from '../../modes/parking/use-parking-mode-handlers'
import { useActiveStreetSpaceMode } from '../../modes/registry'
import { useSurfaceModeHandlers } from '../../modes/surface/use-surface-mode-handlers'
import type { StreetSpaceModeId } from '../../modes/types'
import { useWidthModeHandlers } from '../../modes/width/use-width-mode-handlers'
import { coverageDebugFetchFillLayerId } from './CoverageDebugLayers'
import { useCoverageDebugHover } from './CoverageDebugOverlay'
import {
  WAY_CUT_MARKERS_HITAREA_LAYER_ID,
  WAY_CUT_PREVIEW_HITAREA_LAYER_ID,
  useWayCutHandler,
} from './use-way-cut'
import { useIsCutActive } from './way-cut-store'

export function useMapPageInteractions() {
  const { debug } = useSearch({ from: '/$mode' })
  const { mode: modeSlug } = useParams({ from: '/$mode' })
  const resolvedModeId = modeSlug as StreetSpaceModeId
  const mode = useActiveStreetSpaceMode(resolvedModeId)
  const isWidthMode = resolvedModeId === 'width'
  const isSurfaceMode = resolvedModeId === 'surface'

  const [cursorStyle, setCursorStyle] = useState('grab')
  const coverageDebug = useCoverageDebugHover()
  const isCutActive = useIsCutActive()
  const { handleCutClick, handleCutMouseMove, clearCutHoverState } = useWayCutHandler()
  const parkingLayerClick = useParkingLayerClickHandler()
  const parkingMapClick = useParkingMapClickHandler()
  const widthHandlers = useWidthModeHandlers()
  const surfaceHandlers = useSurfaceModeHandlers()

  const interactiveLayerIds = [
    ...mode.interactiveLayerIds,
    WAY_CUT_MARKERS_HITAREA_LAYER_ID,
    WAY_CUT_PREVIEW_HITAREA_LAYER_ID,
    ...(debug ? [coverageDebugFetchFillLayerId] : []),
  ]

  function handleLayerClick(event: MapLayerMouseEvent) {
    if (isCutActive && handleCutClick(event)) return
    if (isWidthMode) {
      widthHandlers.handleLayerClick(event)
      return
    }
    if (isSurfaceMode) {
      surfaceHandlers.handleLayerClick(event)
      return
    }
    parkingLayerClick(event)
  }

  function handleMapClick(event: MapLayerMouseEvent) {
    if (isCutActive && handleCutClick(event)) return
    if (isWidthMode) {
      widthHandlers.handleMapClick()
      return
    }
    if (isSurfaceMode) {
      surfaceHandlers.handleMapClick()
      return
    }
    parkingMapClick()
  }

  function handleMouseMove(event: MapLayerMouseEvent) {
    if (isWidthMode) {
      widthHandlers.handleMouseMove(event)
    }

    if (isCutActive) {
      const cutMove = handleCutMouseMove(event)
      setCursorStyle(cutMove?.nearCutTarget ? 'pointer' : 'crosshair')
    } else {
      setCursorStyle(event.features?.length ? 'pointer' : 'grab')
    }

    coverageDebug.handleMouseMove(event)
  }

  function handleMouseLeave() {
    if (isWidthMode) {
      widthHandlers.handleMouseUp()
    }
    if (isCutActive) {
      clearCutHoverState()
    }
    setCursorStyle(isCutActive ? 'crosshair' : 'grab')
    coverageDebug.clearHover()
  }

  function handleMouseDown(event: MapLayerMouseEvent) {
    if (!isWidthMode) return
    widthHandlers.handleMouseDown(event)
  }

  function handleMouseUp(_event: MapMouseEvent) {
    if (!isWidthMode) return
    widthHandlers.handleMouseUp()
  }

  function handleClick(event: MapLayerMouseEvent) {
    if (isCutActive && handleCutClick(event)) return
    if (event.features?.length) {
      handleLayerClick(event)
      return
    }
    handleMapClick(event)
  }

  return {
    cursorStyle,
    interactiveLayerIds,
    coverageDebug,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClick,
  }
}
