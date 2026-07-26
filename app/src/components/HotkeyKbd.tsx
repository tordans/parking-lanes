import { formatForDisplay, type RegisterableHotkey } from '@tanstack/react-hotkeys'
import clsx from 'clsx'

/** Platform-aware keyboard badge for tooltips and helper copy. */
export function HotkeyKbd({
  hotkey,
  className,
}: {
  hotkey: RegisterableHotkey
  className?: string
}) {
  return (
    <kbd
      className={clsx(
        'inline-flex items-center rounded border border-current/25 bg-current/10 px-1 py-px font-mono text-[10px] leading-none font-medium',
        className,
      )}
    >
      {formatForDisplay(hotkey)}
    </kbd>
  )
}
