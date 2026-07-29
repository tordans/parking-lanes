import { createContext, useContext, type ReactNode } from 'react'
import type { UiLocale } from '../../../i18n/uiLocale'

const MeasureGuideLocaleContext = createContext<UiLocale | undefined>(undefined)

/** Audit page provides an explicit locale so toggles update copy without a full reload. */
export function MeasureGuideLocaleProvider(props: { locale: UiLocale; children: ReactNode }) {
  return (
    <MeasureGuideLocaleContext.Provider value={props.locale}>
      {props.children}
    </MeasureGuideLocaleContext.Provider>
  )
}

export function useMeasureGuideLocale(): UiLocale | undefined {
  return useContext(MeasureGuideLocaleContext)
}

type MessageFn = (inputs?: Record<string, never>, options?: { locale?: UiLocale }) => string

/** Call a paraglide message, honoring an audit-page locale override when present. */
export function callGuideMessage(fn: MessageFn, locale: UiLocale | undefined): string {
  return locale != null ? fn({}, { locale }) : fn()
}
