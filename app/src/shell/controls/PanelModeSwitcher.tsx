import clsx from 'clsx'
import { Info, MousePointerClick, Settings } from 'lucide-react'
import { LayoutGroup, motion } from 'motion/react'

export type MapPanelMode = 'info' | 'inspector' | 'settings'

const panelModes: { id: MapPanelMode; label: string; Icon: typeof Info }[] = [
  { id: 'info', label: 'Info', Icon: Info },
  { id: 'inspector', label: 'Inspector', Icon: MousePointerClick },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

const panelTabClassName =
  'relative flex flex-1 cursor-pointer items-center justify-center py-2.5 text-zinc-500 transition-colors hover:text-zinc-700'

const panelTabActiveClassName =
  'relative flex flex-1 cursor-default items-center justify-center py-2.5 text-zinc-900'

export function PanelModeSwitcher(props: {
  mode: MapPanelMode
  onChange: (mode: MapPanelMode) => void
  className?: string
}) {
  return (
    <LayoutGroup id="panel-mode-tabs">
      <div
        className={clsx('flex border-b border-zinc-950/10 px-2', props.className)}
        role="tablist"
        aria-label="Map panel"
      >
        {panelModes.map(({ id, label, Icon }) => {
          const isActive = props.mode === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={label}
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
