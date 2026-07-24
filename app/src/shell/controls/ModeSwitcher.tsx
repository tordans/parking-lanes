import { Tooltip } from '../../components/Tooltip/Tooltip'
import { modeIcons } from '../../modes/mode-icons'
import { streetSpaceModes } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import { useActiveMode, useAppActions } from '../app-store'

export function ModeSwitcher() {
  const activeMode = useActiveMode()
  const { setActiveMode } = useAppActions()

  return (
    <div
      className="flex overflow-visible rounded-lg ring-1 ring-zinc-950/10"
      role="tablist"
      aria-label="Street space mode"
    >
      {streetSpaceModes.map((mode, index) => {
        const isActive = mode.id === activeMode
        const Icon = modeIcons[mode.id]
        const tooltip = mode.enabled ? mode.label : `${mode.label} (coming soon)`
        const isFirst = index === 0
        const isLast = index === streetSpaceModes.length - 1

        return (
          <Tooltip key={mode.id} content={isActive ? null : tooltip} placement="bottom">
            <span className="inline-flex">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={mode.label}
                disabled={!mode.enabled}
                className={clsxModeButton({ isActive, enabled: mode.enabled, isFirst, isLast })}
                onClick={() => {
                  if (!mode.enabled) return
                  setActiveMode(mode.id as StreetSpaceModeId)
                }}
              >
                <Icon className="size-7 shrink-0" aria-hidden />
                {isActive ? (
                  <span className="flex flex-col items-start text-left text-[11px] leading-[1.15] font-medium">
                    <span>{mode.label}</span>
                    <span>Editor</span>
                  </span>
                ) : null}
              </button>
            </span>
          </Tooltip>
        )
      })}
    </div>
  )
}

function clsxModeButton({
  isActive,
  enabled,
  isFirst,
  isLast,
}: {
  isActive: boolean
  enabled: boolean
  isFirst: boolean
  isLast: boolean
}) {
  const corners =
    isFirst && isLast ? 'rounded-lg' : isFirst ? 'rounded-l-lg' : isLast ? 'rounded-r-lg' : ''

  const sizing = isActive ? 'gap-1 p-1.5' : 'p-1.5'

  const tone = isActive
    ? 'bg-zinc-950 text-white'
    : enabled
      ? 'bg-white text-zinc-800 hover:bg-zinc-950/5'
      : 'cursor-not-allowed bg-zinc-50 text-zinc-400'

  return `flex items-center font-medium transition-colors ${sizing} ${corners} ${tone}`
}
