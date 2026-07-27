import { getLocale, setLocale } from '@app/paraglide/runtime'
import { useSyncExternalStore } from 'react'
import { DEFAULT_UI_LOCALE, isUiLocale, type UiLocale } from './uiLocale'

const localeListeners = new Set<() => void>()

const notifyLocaleListeners = () => {
  for (const listener of localeListeners) {
    listener()
  }
}

const subscribeToUiLocale = (listener: () => void) => {
  localeListeners.add(listener)
  return () => localeListeners.delete(listener)
}

export const getUiLocale = (): UiLocale => {
  const locale = getLocale()
  return isUiLocale(locale) ? locale : DEFAULT_UI_LOCALE
}

export const setUiLocale = (locale: UiLocale) => {
  setLocale(locale, { reload: false })
  notifyLocaleListeners()
}

export const useUiLocale = (): UiLocale =>
  useSyncExternalStore(subscribeToUiLocale, getUiLocale, () => DEFAULT_UI_LOCALE)
