import clsx from 'clsx'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import { modeIcons } from '../../modes/mode-icons'
import { streetSpaceModes } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import { useActiveMode, useAppActions } from '../app-store'
import {
  mapToolbarButtonDividerClassName,
  mapToolbarButtonGroupClassName,
} from '../map/mobileMapChrome.const'
import { MapToolbarLoadingIndicator } from './MapToolbarLoadingIndicator'

export function ModeSwitcher() {
  const activeMode = useActiveMode()
  const { setActiveMode } = useAppActions()

  return (
    <div className="flex items-center gap-2">
      <div className={mapToolbarButtonGroupClassName} role="tablist" aria-label="Street space mode">
        {streetSpaceModes.map((mode, index) => {
          const isActive = mode.id === activeMode
          const Icon = modeIcons[mode.id]
          const tooltip = mode.enabled ? mode.label : `${mode.label} (coming soon)`

          return (
            <Tooltip key={mode.id} content={isActive ? null : tooltip} placement="bottom">
              <span className="inline-flex">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={mode.label}
                  disabled={!mode.enabled}
                  className={clsxModeButton({ isActive, enabled: mode.enabled, index })}
                  onClick={() => {
                    if (!mode.enabled) return
                    setActiveMode(mode.id as StreetSpaceModeId)
                  }}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
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
      <MapToolbarLoadingIndicator />
    </div>
  )
}

function clsxModeButton({
  isActive,
  enabled,
  index,
}: {
  isActive: boolean
  enabled: boolean
  index: number
}) {
  // Match PanelModeSwitcher / map toolbar segment height (size-10).
  const sizing = isActive ? 'h-10 gap-1.5 px-2.5' : 'size-10 justify-center'

  const tone = isActive
    ? 'cursor-pointer bg-zinc-950 text-white'
    : enabled
      ? 'cursor-pointer bg-white text-zinc-800 hover:bg-zinc-950/5'
      : 'cursor-not-allowed bg-zinc-50 text-zinc-400'

  return clsx(
    'flex items-center font-medium transition-colors',
    sizing,
    tone,
    index > 0 && mapToolbarButtonDividerClassName,
  )
}
