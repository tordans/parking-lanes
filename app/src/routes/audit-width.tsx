import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isUiLocale, type UiLocale } from '../i18n/uiLocale'
import { WidthAuditPage } from '../modes/width/measure-guide/WidthAuditPage'

/**
 * Static route — must outrank `/$mode`, whose params.parse coerces unknown slugs to `parking`.
 * Without this file, `/audit-width` silently shows the parking map.
 */
export const Route = createFileRoute('/audit-width')({
  validateSearch: z.object({
    locale: z
      .string()
      .optional()
      .transform((s): UiLocale | undefined => (isUiLocale(s) ? s : undefined)),
  }),
  component: AuditWidthRoute,
})

function AuditWidthRoute() {
  const { locale } = Route.useSearch()
  return <WidthAuditPage locale={locale} />
}
