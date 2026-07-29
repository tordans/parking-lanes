import { useHotkey } from '@tanstack/react-hotkeys'
import { useSearch } from '@tanstack/react-router'
import {
  useBackgroundHistoryActions,
  usePreviousBackgroundLayerId,
} from './background-history-store'
import { useModeSearchNavigation } from './use-mode-search-navigation'

/** ELI background slug from `?bg=…`, or `null` when omitted (default OpenFreeMap). */
export function useBackgroundLayerId(): string | null {
  const { bg } = useSearch({ from: '/$mode' })
  return bg ?? null
}

export function useSetBackgroundLayerId() {
  const { updateSearch } = useModeSearchNavigation()
  const currentId = useBackgroundLayerId()
  const { rememberPrevious } = useBackgroundHistoryActions()

  return (backgroundLayerId: string | null) => {
    if (backgroundLayerId !== currentId) {
      rememberPrevious(currentId)
    }
    updateSearch({ bg: backgroundLayerId ?? undefined }, { replace: true })
  }
}

/** Toggle between the current and previous background (iD-style Mod+B). */
export function useTogglePreviousBackgroundLayer() {
  const previousId = usePreviousBackgroundLayerId()
  const setBackgroundLayerId = useSetBackgroundLayerId()

  return () => {
    if (previousId === undefined) return
    setBackgroundLayerId(previousId)
  }
}

export function useBackgroundHotkeys() {
  const togglePrevious = useTogglePreviousBackgroundLayer()
  const previousId = usePreviousBackgroundLayerId()

  useHotkey('Mod+B', () => togglePrevious(), {
    enabled: previousId !== undefined,
    // HMR / Strict Mode can remount before the prior registration cleans up.
    conflictBehavior: 'replace',
  })
}
