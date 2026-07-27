import { useEffect } from 'react'
import { setCurrentBackgroundLayerId } from './imagery-usage-session'
import { useBackgroundLayerId } from './use-background-layer'

/** Sync the active background layer into the imagery-usage session resolver. */
export function useSyncBackgroundImageryContext() {
  const backgroundLayerId = useBackgroundLayerId()

  useEffect(() => {
    setCurrentBackgroundLayerId(backgroundLayerId)
  }, [backgroundLayerId])
}
