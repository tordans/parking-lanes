import { useNavigate, useRouter } from '@tanstack/react-router'

/** Search updates for `/$mode` only — no-ops once another route is active. */
export function useModeSearchNavigate() {
  const router = useRouter()
  const navigate = useNavigate({ from: '/$mode' })

  return ((options) => {
    if (!router.state.matches.some((match) => match.routeId === '/$mode')) return
    void navigate(options)
  }) as typeof navigate
}
