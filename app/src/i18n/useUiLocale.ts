import { getLocale, setLocale } from '@app/paraglide/runtime'
import { useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useModeSearchNavigation } from '../shell/map/use-mode-search-navigation'
import { DEFAULT_UI_LOCALE, isUiLocale, readUiLocale, type UiLocale } from './uiLocale'

function syncParaglideLocale(locale: UiLocale) {
  const current = getLocale()
  if (current !== locale) {
    setLocale(locale, { reload: false })
  }
}

/** URL `locale` is source of truth; omitted means {@link DEFAULT_UI_LOCALE}. */
export function useUiLocale(): UiLocale {
  const { locale } = useSearch({ from: '/$mode' })
  const uiLocale = readUiLocale(locale)
  // Keep paraglide in sync during render so message calls in the same tree see the URL locale.
  syncParaglideLocale(uiLocale)
  return uiLocale
}

export function useSetUiLocale() {
  const { updateSearch } = useModeSearchNavigation()

  return useCallback(
    (next: UiLocale) => {
      if (!isUiLocale(next)) return
      syncParaglideLocale(next)
      updateSearch({ locale: next === DEFAULT_UI_LOCALE ? undefined : next }, { replace: true })
    },
    [updateSearch],
  )
}
