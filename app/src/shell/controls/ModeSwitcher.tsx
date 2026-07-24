import { streetSpaceModes } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import { useActiveMode, useAppActions } from '../app-store'

export function ModeSwitcher() {
  const activeMode = useActiveMode()
  const { setActiveMode } = useAppActions()

  return (
    <div
      className="flex overflow-hidden rounded-lg ring-1 ring-zinc-950/10"
      role="tablist"
      aria-label="Street space mode"
    >
      {streetSpaceModes.map((mode) => {
        const isActive = mode.id === activeMode
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={!mode.enabled}
            title={mode.enabled ? mode.label : `${mode.label} (coming soon)`}
            className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-zinc-950 text-white'
                : mode.enabled
                  ? 'bg-white text-zinc-800 hover:bg-zinc-950/5'
                  : 'cursor-not-allowed bg-zinc-50 text-zinc-400'
            }`}
            onClick={() => {
              if (!mode.enabled) return
              setActiveMode(mode.id as StreetSpaceModeId)
            }}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
