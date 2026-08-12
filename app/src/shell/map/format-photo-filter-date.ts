import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import type { Locale } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import type { UiLocale } from '../../i18n/uiLocale'

const DATE_FNS_LOCALE: Record<UiLocale, Locale> = {
  de,
  en: enUS,
}

/** Browser IANA zone, falling back to UTC when unavailable (SSR / tests). */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Format a stored `YYYY-MM-dd` photo filter date for the UI locale in `timeZone`. */
export function formatPhotoFilterDate(
  isoDate: string,
  uiLocale: UiLocale,
  timeZone: string = browserTimeZone(),
): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) return isoDate
  // Noon avoids DST edge cases when interpreting a calendar day.
  const tzDate = new TZDate(year, month - 1, day, 12, 0, 0, timeZone)
  return format(tzDate, 'P', { locale: DATE_FNS_LOCALE[uiLocale] })
}
