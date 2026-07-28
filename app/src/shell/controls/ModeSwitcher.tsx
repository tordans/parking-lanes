import * as m from '@app/paraglide/messages'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useNavigate, useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { HotkeyKbd } from '../../components/HotkeyKbd'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import { getModeLabel } from '../../i18n/mode-content'
import { MODE_HOTKEYS } from '../../modes/mode-hotkeys'
import { modeIcons } from '../../modes/mode-icons'
import { streetSpaceModes } from '../../modes/registry'
import {
  mapToolbarButtonDividerClassName,
  mapToolbarButtonGroupClassName,
} from '../map/mobileMapChrome.const'
import { serializeMapSearch } from '../map/search-schema'
import { FocusFilterButton } from './FocusFilterButton'
import { MapToolbarLoadingIndicator } from './MapToolbarLoadingIndicator'
import { SplitWayButton } from './SplitWayButton'

export function ModeSwitcher() {
  const navigate = useNavigate({ from: '/$mode' })
  const { mode: currentMode } = useParams({ from: '/$mode' })

  return (
    <div className="flex items-center gap-2">
      <div
        className={mapToolbarButtonGroupClassName}
        role="tablist"
        aria-label={m.shell_mode_switcher_aria()}
      >
        {streetSpaceModes.map((mode, index) => {
          const isActive = mode.id === currentMode
          const Icon = modeIcons[mode.id]
          const hotkey = MODE_HOTKEYS[mode.id]
          const modeLabel = getModeLabel(mode.id)
          const label = mode.enabled ? modeLabel : `${modeLabel} ${m.shell_mode_coming_soon()}`

          return (
            <Tooltip
              key={mode.id}
              content={
                isActive ? null : (
                  <>
                    <span>{label}</span>
                    {mode.enabled ? <HotkeyKbd hotkey={hotkey} /> : null}
                  </>
                )
              }
              placement="bottom"
            >
              <span className="inline-flex">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={
                    mode.enabled ? `${modeLabel} (${formatForDisplay(hotkey)})` : modeLabel
                  }
                  disabled={!mode.enabled}
                  className={clsxModeButton({ isActive, enabled: mode.enabled, index })}
                  onClick={() => {
                    if (!mode.enabled || isActive) return
                    void navigate({
                      to: '/$mode',
                      params: { mode: mode.id },
                      search: (prev) => serializeMapSearch(prev),
                      replace: true,
                    })
                  }}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {isActive ? (
                    <span className="flex flex-col items-start text-left text-[11px] leading-[1.15] font-medium">
                      <span>{modeLabel}</span>
                      <span>{m.shell_mode_editor_suffix()}</span>
                    </span>
                  ) : null}
                </button>
              </span>
            </Tooltip>
          )
        })}
      </div>
      <SplitWayButton />
      <FocusFilterButton />
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
  const sizing = isActive ? 'h-10 gap-1.5 px-2.5' : 'size-10 justify-center'

  const tone = isActive
    ? 'cursor-pointer bg-zinc-950 text-white'
    : enabled
      ? 'cursor-pointer bg-white text-zinc-800 hover:bg-zinc-100 active:bg-zinc-200'
      : 'cursor-not-allowed bg-zinc-50 text-zinc-400'

  return clsx(
    'flex items-center font-medium transition-colors',
    sizing,
    tone,
    index > 0 && mapToolbarButtonDividerClassName,
  )
}
