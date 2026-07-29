import { useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { nextBoundariesFocusState, readBoundariesEnabled } from './map-focus-state'
import { useModeSearchNavigation } from './use-mode-search-navigation'

export function useMapBoundariesEnabled(): boolean {
  const { focus } = useSearch({ from: '/$mode' })
  return readBoundariesEnabled(focus)
}

export function useMapBoundaries() {
  const { updateSearch } = useModeSearchNavigation()
  const { focus } = useSearch({ from: '/$mode' })
  const boundariesEnabled = readBoundariesEnabled(focus)

  const setBoundariesEnabled = useCallback(
    (enabled: boolean) => {
      updateSearch(
        (prev) => ({
          focus: nextBoundariesFocusState(prev.focus, enabled),
        }),
        { replace: true },
      )
    },
    [updateSearch],
  )

  return { boundariesEnabled, setBoundariesEnabled }
}
