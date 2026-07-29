import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isUiLocale, type UiLocale } from '../i18n/uiLocale'
import { LanesAuditPage } from '../modes/lanes/audit/LanesAuditPage'

/**
 * Static route — must outrank `/$mode`, whose params.parse coerces unknown slugs to `parking`.
 * Without this file, `/audit-lanes` silently shows the parking map.
 */
export const Route = createFileRoute('/audit-lanes')({
  validateSearch: z.object({
    locale: z
      .string()
      .optional()
      .transform((s): UiLocale | undefined => (isUiLocale(s) ? s : undefined)),
  }),
  component: AuditLanesRoute,
})

function AuditLanesRoute() {
  return <LanesAuditPage />
}
