import { useParams, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { StreetSpaceModeId } from '../../modes/types'
import { focusSearchIsEmpty } from './map-focus-state'
import {
  type BicycleFocus,
  type MapFocus,
  type ParkingFocus,
  type SurfaceFocus,
  type WidthFocus,
} from './search-schema'
import { useModeSearchNavigation } from './use-mode-search-navigation'

const focusModes = new Set<StreetSpaceModeId>(['parking', 'width', 'bicycle', 'surface'])

export function useMapFocusSupportsCurrentMode(): boolean {
  const { mode } = useParams({ from: '/$mode' })
  return focusModes.has(mode)
}

export function useMapFocus(): {
  focus: ParkingFocus | WidthFocus | BicycleFocus | SurfaceFocus
  setFocus: (value: ParkingFocus | WidthFocus | BicycleFocus | SurfaceFocus) => void
  isActive: boolean
} {
  const { mode } = useParams({ from: '/$mode' })
  const { updateSearch } = useModeSearchNavigation()
  const search = useSearch({ from: '/$mode' })

  const focus = readFocusForMode(mode, search.focus)
  const isActive = focus !== 'all'

  const setFocus = useCallback(
    (value: ParkingFocus | WidthFocus | BicycleFocus | SurfaceFocus) => {
      updateSearch(
        (prev) => ({
          focus: nextFocusState(prev.focus, mode, value),
        }),
        { replace: true },
      )
    },
    [mode, updateSearch],
  )

  return { focus, setFocus, isActive }
}

function readFocusForMode(
  mode: StreetSpaceModeId,
  focus: MapFocus | undefined,
): ParkingFocus | WidthFocus | BicycleFocus | SurfaceFocus {
  if (mode === 'parking') return focus?.parking ?? 'all'
  if (mode === 'width') return focus?.width ?? 'all'
  if (mode === 'bicycle') return focus?.bicycle ?? 'all'
  if (mode === 'surface') return focus?.surface ?? 'all'
  return 'all'
}

function nextFocusState(
  current: MapFocus | undefined,
  mode: StreetSpaceModeId,
  value: ParkingFocus | WidthFocus | BicycleFocus | SurfaceFocus,
): MapFocus | undefined {
  const next: NonNullable<MapFocus> = { ...current }

  if (mode === 'parking') {
    const parkingValue = value as ParkingFocus
    if (parkingValue === 'all') delete next.parking
    else next.parking = parkingValue
  } else if (mode === 'width') {
    const widthValue = value as WidthFocus
    if (widthValue === 'all') delete next.width
    else next.width = widthValue
  } else if (mode === 'bicycle') {
    const bicycleValue = value as BicycleFocus
    if (bicycleValue === 'all') delete next.bicycle
    else next.bicycle = bicycleValue
  } else if (mode === 'surface') {
    const surfaceValue = value as SurfaceFocus
    if (surfaceValue === 'all') delete next.surface
    else next.surface = surfaceValue
  }

  if (
    !next.parking &&
    !next.width &&
    !next.bicycle &&
    !next.surface &&
    next.boundaries === undefined
  ) {
    return undefined
  }
  if (focusSearchIsEmpty(next)) return undefined
  return next
}
