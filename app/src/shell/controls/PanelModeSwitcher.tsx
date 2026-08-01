import * as m from '@app/paraglide/messages'
import clsx from 'clsx'
import { Info, MousePointerClick, Settings } from 'lucide-react'
import { LayoutGroup, motion } from 'motion/react'

export type MapPanelMode = 'info' | 'inspector' | 'settings'

const panelModes: { id: MapPanelMode; label: () => string; Icon: typeof Info }[] = [
  { id: 'info', label: m.shell_panel_info, Icon: Info },
  { id: 'inspector', label: m.shell_panel_inspector, Icon: MousePointerClick },
  { id: 'settings', label: m.shell_panel_settings, Icon: Settings },
]

export function panelModesForMode(modeId: string): MapPanelMode[] {
  if (modeId === 'lanes' || modeId === 'table') return ['info', 'settings']
  return ['info', 'inspector', 'settings']
}

const panelTabClassName =
  'relative flex flex-1 cursor-pointer items-center justify-center py-2.5 text-zinc-500 transition-colors hover:text-zinc-700'

const panelTabActiveClassName =
  'relative flex flex-1 cursor-default items-center justify-center py-2.5 text-zinc-900'

export function PanelModeSwitcher(props: {
  mode: MapPanelMode
  onChange: (mode: MapPanelMode) => void
  className?: string
  modes?: MapPanelMode[]
}) {
  const visibleModes = props.modes
    ? panelModes.filter((mode) => props.modes!.includes(mode.id))
    : panelModes
  return (
    <LayoutGroup id="panel-mode-tabs">
      <div
        className={clsx('flex border-b border-zinc-950/10 px-2', props.className)}
        role="tablist"
        aria-label="Map panel"
      >
        {visibleModes.map(({ id, label, Icon }) => {
          const isActive = props.mode === id
          const labelText = label()
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={labelText}
              className={isActive ? panelTabActiveClassName : panelTabClassName}
              onClick={() => {
                if (isActive) return
                props.onChange(id)
              }}
            >
              {isActive ? (
                <motion.span
                  layoutId="panel-tab-indicator"
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-zinc-900"
                />
              ) : null}
              <Icon className="size-5" aria-hidden />
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
