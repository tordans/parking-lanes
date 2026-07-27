export const uiLocales = ['de', 'en'] as const
export type UiLocale = (typeof uiLocales)[number]

export const DEFAULT_UI_LOCALE = 'de' satisfies UiLocale

const uiLocaleSet = new Set<string>(uiLocales)

export const isUiLocale = (value: string | undefined | null): value is UiLocale =>
  value != null && uiLocaleSet.has(value)
