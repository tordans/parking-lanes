import clsx from 'clsx'
import { Bug, Info, MousePointerClick, Settings } from 'lucide-react'
import {
  mapToolbarButtonDividerClassName,
  mapToolbarButtonGroupClassName,
  mapToolbarIconSegmentActiveClassName,
  mapToolbarIconSegmentClassName,
} from '../map/mobileMapChrome.const'

export type MapPanelMode = 'info' | 'inspector' | 'settings' | 'debug'

const allPanelModes: { id: MapPanelMode; label: string; Icon: typeof Info }[] = [
  { id: 'info', label: 'Info', Icon: Info },
  { id: 'inspector', label: 'Inspector', Icon: MousePointerClick },
  { id: 'settings', label: 'Settings', Icon: Settings },
  { id: 'debug', label: 'Debug', Icon: Bug },
]

export function PanelModeSwitcher(props: {
  mode: MapPanelMode
  onChange: (mode: MapPanelMode) => void
  showDebug?: boolean
  className?: string
}) {
  const panelModes = props.showDebug
    ? allPanelModes
    : allPanelModes.filter((entry) => entry.id !== 'debug')

  return (
    <div
      className={clsx(mapToolbarButtonGroupClassName, props.className)}
      role="tablist"
      aria-label="Map panel"
    >
      {panelModes.map(({ id, label, Icon }, index) => {
        const isActive = props.mode === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={label}
            className={clsx(
              mapToolbarIconSegmentClassName,
              'w-full flex-1',
              index > 0 && mapToolbarButtonDividerClassName,
              isActive && mapToolbarIconSegmentActiveClassName,
            )}
            onClick={() => props.onChange(id)}
          >
            <Icon className="size-5" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
