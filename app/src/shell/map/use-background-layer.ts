import { useNavigate, useSearch } from '@tanstack/react-router'
import { serializeMapSearch } from './search-schema'

/** ELI background slug from `?bg=…`, or `null` when omitted (default OpenFreeMap). */
export function useBackgroundLayerId(): string | null {
  const { bg } = useSearch({ from: '/$mode' })
  return bg ?? null
}

export function useSetBackgroundLayerId() {
  const navigate = useNavigate({ from: '/$mode' })

  return (backgroundLayerId: string | null) => {
    void navigate({
      search: (prev) => ({
        ...serializeMapSearch(prev),
        bg: backgroundLayerId ?? undefined,
      }),
      replace: true,
    })
  }
}
