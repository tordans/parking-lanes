import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isUiLocale, type UiLocale } from '../../i18n/uiLocale'
import { LanesAuditLayout } from '../../modes/lanes/audit/LanesAuditPage'

/**
 * Layout for `/audit-lanes` and `/audit-lanes/$demoId`.
 * Static path must outrank `/$mode` (unknown slugs become parking).
 */
export const Route = createFileRoute('/audit-lanes')({
  validateSearch: z.object({
    locale: z
      .string()
      .optional()
      .transform((s): UiLocale | undefined => (isUiLocale(s) ? s : undefined)),
  }),
  component: LanesAuditLayout,
})
