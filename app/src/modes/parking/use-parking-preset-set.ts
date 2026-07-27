import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { serializeMapSearch } from '../../shell/map/search-schema'
import { DEFAULT_PARKING_PRESET_SET, type ParkingPresetSetId } from './domain/editor/preset-sets'
import { readParkingPresetSet } from './parking-preset-set-state'

export function useParkingPresetSet() {
  const navigate = useNavigate({ from: '/$mode' })
  const { presets } = useSearch({ from: '/$mode' })
  const presetSet = readParkingPresetSet(presets)

  const setPresetSet = useCallback(
    (next: ParkingPresetSetId) => {
      void navigate({
        search: (prev) => ({
          ...serializeMapSearch({
            ...prev,
            presets: next === DEFAULT_PARKING_PRESET_SET ? undefined : next,
          }),
        }),
        replace: true,
      })
    },
    [navigate],
  )

  return { presetSet, setPresetSet }
}
