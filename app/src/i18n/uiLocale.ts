export const uiLocales = ['de', 'en'] as const
export type UiLocale = (typeof uiLocales)[number]

/** Default UI language when `locale` is omitted from the URL (same param name as iD). */
export const DEFAULT_UI_LOCALE = 'en' satisfies UiLocale

const uiLocaleSet = new Set<string>(uiLocales)

export const isUiLocale = (value: string | undefined | null): value is UiLocale =>
  value != null && uiLocaleSet.has(value)

export function readUiLocale(locale: UiLocale | undefined): UiLocale {
  return locale ?? DEFAULT_UI_LOCALE
}
