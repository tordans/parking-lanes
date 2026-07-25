import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { StreetSpaceModeId } from '../../modes/types'
import {
  type MapFocus,
  type ParkingFocus,
  type WidthFocus,
  serializeMapSearch,
} from './search-schema'

const focusModes = new Set<StreetSpaceModeId>(['parking', 'width'])

export function useMapFocusSupportsCurrentMode(): boolean {
  const { mode } = useParams({ from: '/$mode' })
  return focusModes.has(mode)
}

export function useMapFocus(): {
  focus: ParkingFocus | WidthFocus
  setFocus: (value: ParkingFocus | WidthFocus) => void
  isActive: boolean
} {
  const { mode } = useParams({ from: '/$mode' })
  const navigate = useNavigate({ from: '/$mode' })
  const search = useSearch({ from: '/$mode' })

  const focus = readFocusForMode(mode, search.focus)
  const isActive = focus !== 'all'

  const setFocus = useCallback(
    (value: ParkingFocus | WidthFocus) => {
      void navigate({
        search: (prev) => ({
          ...serializeMapSearch(prev),
          focus: nextFocusState(prev.focus, mode, value),
        }),
        replace: true,
      })
    },
    [mode, navigate],
  )

  return { focus, setFocus, isActive }
}

function readFocusForMode(
  mode: StreetSpaceModeId,
  focus: MapFocus | undefined,
): ParkingFocus | WidthFocus {
  if (mode === 'parking') return focus?.parking ?? 'all'
  if (mode === 'width') return focus?.width ?? 'all'
  return 'all'
}

function nextFocusState(
  current: MapFocus | undefined,
  mode: StreetSpaceModeId,
  value: ParkingFocus | WidthFocus,
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
  }

  if (!next.parking && !next.width) return undefined
  return next
}
