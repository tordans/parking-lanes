import { useEffect } from 'react'

/**
 * Writes the visible viewport height into `--app-height` so full-bleed routes can use
 * `h-(--app-height,100dvh)` instead of raw viewport units (unreliable on iOS browsers).
 */
export function useVisibleViewportHeightVar(enabled: boolean) {
  useEffect(
    function syncVisibleViewportHeight() {
      if (!enabled || typeof window === 'undefined') return

      const root = document.documentElement
      const update = () => {
        root.style.setProperty('--app-height', `${window.innerHeight}px`)
      }
      update()

      window.addEventListener('resize', update)
      window.addEventListener('orientationchange', update)
      window.visualViewport?.addEventListener('resize', update)

      return function resetVisibleViewportHeight() {
        window.removeEventListener('resize', update)
        window.removeEventListener('orientationchange', update)
        window.visualViewport?.removeEventListener('resize', update)
        root.style.removeProperty('--app-height')
      }
    },
    [enabled],
  )
}
