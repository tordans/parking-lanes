import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import {
  DEFAULT_AUDIT_DEMO_ID,
  isAuditDemoId,
  type AuditDemoId,
} from '../../modes/lanes/audit/audit-demos'
import { LanesAuditDemo } from '../../modes/lanes/audit/LanesAuditPage'

const demoParamsSchema = z.object({
  demoId: z.string(),
})

/**
 * One demo at a time — shareable URL e.g. `/audit-lanes/karl-marx-bi-to-dual`.
 */
export const Route = createFileRoute('/audit-lanes/$demoId')({
  params: {
    parse: (raw): { demoId: AuditDemoId } => {
      const { demoId } = demoParamsSchema.parse(raw)
      if (isAuditDemoId(demoId)) return { demoId }
      // Soft-fallback so unknown bookmarks land on the first demo (mirrors `/$mode`).
      return { demoId: DEFAULT_AUDIT_DEMO_ID }
    },
    stringify: ({ demoId }) => ({ demoId }),
  },
  beforeLoad: ({ search, location }) => {
    const segment = location.pathname.split('/').filter(Boolean).at(-1)
    if (segment && !isAuditDemoId(segment)) {
      throw redirect({
        to: '/audit-lanes/$demoId',
        params: { demoId: DEFAULT_AUDIT_DEMO_ID },
        search,
        replace: true,
      })
    }
  },
  component: AuditLanesDemoRoute,
})

function AuditLanesDemoRoute() {
  const { demoId } = Route.useParams()
  return <LanesAuditDemo demoId={demoId} />
}
