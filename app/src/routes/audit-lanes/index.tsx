import { createFileRoute, redirect } from '@tanstack/react-router'
import { DEFAULT_AUDIT_DEMO_ID } from '../../modes/lanes/audit/audit-demos'

/** `/audit-lanes` → first demo (shareable path per demo). */
export const Route = createFileRoute('/audit-lanes/')({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/audit-lanes/$demoId',
      params: { demoId: DEFAULT_AUDIT_DEMO_ID },
      search,
      replace: true,
    })
  },
})
