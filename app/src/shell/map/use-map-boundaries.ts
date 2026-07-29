import { useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { nextBoundariesFocusState, readBoundariesEnabled } from './map-focus-state'
import { serializeMapSearch } from './search-schema'
import { useModeSearchNavigate } from './use-mode-search-navigate'

export function useMapBoundariesEnabled(): boolean {
  const { focus } = useSearch({ from: '/$mode' })
  return readBoundariesEnabled(focus)
}

export function useMapBoundaries() {
  const navigate = useModeSearchNavigate()
  const { focus } = useSearch({ from: '/$mode' })
  const boundariesEnabled = readBoundariesEnabled(focus)

  const setBoundariesEnabled = useCallback(
    (enabled: boolean) => {
      void navigate({
        search: (prev) => ({
          ...serializeMapSearch({
            ...prev,
            focus: nextBoundariesFocusState(prev.focus, enabled),
          }),
        }),
        replace: true,
      })
    },
    [navigate],
  )

  return { boundariesEnabled, setBoundariesEnabled }
}
