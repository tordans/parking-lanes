import { useHotkeys } from '@tanstack/react-hotkeys'
import { useNavigate, useParams } from '@tanstack/react-router'
import { MODE_HOTKEYS } from '../../modes/mode-hotkeys'
import { streetSpaceModes } from '../../modes/registry'
import { serializeMapSearch } from '../map/search-schema'

/** Mode shortcuts — register once from MapPage (not inside ModeSwitcher chrome). */
export function useModeHotkeys() {
  const navigate = useNavigate({ from: '/$mode' })
  const { mode: currentMode } = useParams({ from: '/$mode' })

  useHotkeys(
    streetSpaceModes.map((mode) => ({
      hotkey: MODE_HOTKEYS[mode.id],
      callback: () => {
        if (!mode.enabled || mode.id === currentMode) return
        void navigate({
          to: '/$mode',
          params: { mode: mode.id },
          search: (prev) => serializeMapSearch(prev),
          replace: true,
        })
      },
      options: {
        enabled: mode.enabled && mode.id !== currentMode,
        // HMR / Strict Mode can remount before the prior registration cleans up.
        conflictBehavior: 'replace',
      },
    })),
  )
}
