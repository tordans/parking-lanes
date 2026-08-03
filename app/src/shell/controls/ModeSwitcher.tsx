import * as m from '@app/paraglide/messages'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useNavigate, useParams } from '@tanstack/react-router'
import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { HotkeyKbd } from '../../components/HotkeyKbd'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import { getModeLabel } from '../../i18n/mode-content'
import { MODE_HOTKEYS } from '../../modes/mode-hotkeys'
import { modeIcons } from '../../modes/mode-icons'
import { streetSpaceModes } from '../../modes/registry'
import type { StreetSpaceModeId } from '../../modes/types'
import {
  floatingChromeElevationClassName,
  mapToolbarButtonDividerClassName,
  mapToolbarButtonGroupClassName,
} from '../map/mobileMapChrome.const'
import { serializeMapSearch } from '../map/search-schema'
import { FocusFilterButton } from './FocusFilterButton'
import { MapToolbarLoadingIndicator } from './MapToolbarLoadingIndicator'
import { SplitWayButton } from './SplitWayButton'

/** Expand full mode tabs when the map chrome container is at least this wide. */
const MODE_SWITCHER_EXPANDED = '@[40rem]/map'

export function ModeSwitcher() {
  const navigate = useNavigate({ from: '/$mode' })
  const { mode: currentMode } = useParams({ from: '/$mode' })

  function selectMode(modeId: StreetSpaceModeId) {
    if (modeId === currentMode) return
    void navigate({
      to: '/$mode',
      params: { mode: modeId },
      search: (prev) => serializeMapSearch(prev),
      replace: true,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={clsx(mapToolbarButtonGroupClassName, 'hidden', `${MODE_SWITCHER_EXPANDED}:flex`)}
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
                    selectMode(mode.id)
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

      <div className={clsx('flex', `${MODE_SWITCHER_EXPANDED}:hidden`)}>
        <ModeSwitcherCompact currentMode={currentMode} onSelect={selectMode} />
      </div>

      <SplitWayButton />
      <FocusFilterButton />
      <MapToolbarLoadingIndicator />
    </div>
  )
}

function ModeSwitcherCompact({
  currentMode,
  onSelect,
}: {
  currentMode: string
  onSelect: (modeId: StreetSpaceModeId) => void
}) {
  const active = streetSpaceModes.find((mode) => mode.id === currentMode) ?? streetSpaceModes[0]
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(
    function closeCompactModeMenuOnOutsidePointer() {
      if (!open) return

      function onPointerDown(event: PointerEvent) {
        if (rootRef.current?.contains(event.target as Node)) return
        setOpen(false)
      }

      // Defer so the opening click does not immediately count as outside.
      const timer = window.setTimeout(() => {
        document.addEventListener('pointerdown', onPointerDown)
      }, 0)

      return function removeCompactModeMenuOutsideListener() {
        window.clearTimeout(timer)
        document.removeEventListener('pointerdown', onPointerDown)
      }
    },
    [open],
  )

  if (!active) return null

  const ActiveIcon = modeIcons[active.id]
  const activeLabel = getModeLabel(active.id)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`${activeLabel} ${m.shell_mode_editor_suffix()}. ${m.shell_mode_menu_aria()}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={clsx(
          'flex h-10 items-center gap-1.5 rounded-lg bg-zinc-950 px-2.5 text-white',
          floatingChromeElevationClassName,
        )}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        <ActiveIcon className="size-5 shrink-0" aria-hidden />
        <span className="flex flex-col items-start text-left text-[11px] leading-[1.15] font-medium">
          <span>{activeLabel}</span>
          <span>{m.shell_mode_editor_suffix()}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-80" aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={m.shell_mode_switcher_aria()}
          className="absolute top-full left-0 z-50 mt-2 min-w-52 rounded-xl bg-white/95 p-1 shadow-lg ring-1 ring-zinc-950/10 backdrop-blur-xl"
        >
          {streetSpaceModes.map((mode) => {
            const Icon = modeIcons[mode.id]
            const hotkey = MODE_HOTKEYS[mode.id]
            const modeLabel = getModeLabel(mode.id)
            const isActive = mode.id === currentMode
            const label = mode.enabled ? modeLabel : `${modeLabel} ${m.shell_mode_coming_soon()}`

            return (
              <button
                key={mode.id}
                type="button"
                role="menuitem"
                disabled={!mode.enabled}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-zinc-950',
                  'hover:bg-zinc-100 active:bg-zinc-200',
                  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
                )}
                onClick={() => {
                  setOpen(false)
                  if (!mode.enabled || isActive) return
                  onSelect(mode.id)
                }}
              >
                <Icon className="size-4 shrink-0 text-zinc-500" aria-hidden />
                <span className="min-w-0 flex-1">{label}</span>
                {isActive ? (
                  <Check className="size-4 shrink-0 text-zinc-500" aria-hidden />
                ) : mode.enabled ? (
                  <kbd className="font-sans text-xs text-zinc-400">{formatForDisplay(hotkey)}</kbd>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
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
