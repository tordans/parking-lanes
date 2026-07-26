import { useHotkey } from '@tanstack/react-hotkeys'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  useBackgroundHistoryActions,
  usePreviousBackgroundLayerId,
} from './background-history-store'
import { serializeMapSearch } from './search-schema'

/** ELI background slug from `?bg=…`, or `null` when omitted (default OpenFreeMap). */
export function useBackgroundLayerId(): string | null {
  const { bg } = useSearch({ from: '/$mode' })
  return bg ?? null
}

export function useSetBackgroundLayerId() {
  const navigate = useNavigate({ from: '/$mode' })
  const currentId = useBackgroundLayerId()
  const { rememberPrevious } = useBackgroundHistoryActions()

  return (backgroundLayerId: string | null) => {
    if (backgroundLayerId !== currentId) {
      rememberPrevious(currentId)
    }
    void navigate({
      search: (prev) => ({
        ...serializeMapSearch(prev),
        bg: backgroundLayerId ?? undefined,
      }),
      replace: true,
    })
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
  })
}
