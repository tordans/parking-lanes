import * as m from '@app/paraglide/messages'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { floatingChromeElevationClassName } from '../shell/map/mobileMapChrome.const'
import {
  MIDDLE_COLUMN_WIDTH_MAX,
  MIDDLE_COLUMN_WIDTH_MIN,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  useMiddleColumnWidth,
  useShellPanelActions,
  useSidebarWidth,
} from '../shell/shell-panel-store'

const panelChromeClassName = `relative rounded-lg bg-zinc-100 ${floatingChromeElevationClassName}`

function ResizeGrip({
  value,
  onValueChange,
}: {
  value: number
  onValueChange: (next: number) => void
}) {
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    const target = event.currentTarget
    const origin = event.clientX
    const startValue = value
    target.setPointerCapture(event.pointerId)

    function onPointerMove(moveEvent: PointerEvent) {
      onValueChange(startValue + (origin - moveEvent.clientX))
    }

    function onPointerUp(upEvent: PointerEvent) {
      target.releasePointerCapture(upEvent.pointerId)
      target.removeEventListener('pointermove', onPointerMove)
      target.removeEventListener('pointerup', onPointerUp)
      target.removeEventListener('pointercancel', onPointerUp)
    }

    target.addEventListener('pointermove', onPointerMove)
    target.addEventListener('pointerup', onPointerUp)
    target.addEventListener('pointercancel', onPointerUp)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={m.shell_drag_resize()}
      title={m.shell_drag_resize()}
      onPointerDown={handlePointerDown}
      className="group absolute top-1/2 left-0 z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center px-2 py-3 touch-none"
    >
      <div className="h-10 w-1.5 rounded-full bg-zinc-400/30 transition-colors group-hover:bg-zinc-500/70 group-active:bg-zinc-600/80" />
    </div>
  )
}

export function AppShell({
  map,
  middle,
  panel,
}: {
  map: ReactNode
  middle?: ReactNode
  panel?: ReactNode
}) {
  const sidebarWidth = useSidebarWidth()
  const middleColumnWidth = useMiddleColumnWidth()
  const { setSidebarWidth, setMiddleColumnWidth } = useShellPanelActions()

  return (
    <div className="flex h-(--app-height,100dvh) w-full flex-col overflow-hidden overscroll-none bg-zinc-100 font-sans antialiased sm:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
      {middle ? (
        <aside className="hidden h-full shrink-0 flex-col py-1.5 pr-0 pl-0 sm:flex">
          <div
            className={`flex h-full min-h-0 flex-col ${panelChromeClassName}`}
            style={{
              width: middleColumnWidth,
              minWidth: MIDDLE_COLUMN_WIDTH_MIN,
              maxWidth: MIDDLE_COLUMN_WIDTH_MAX,
            }}
          >
            <ResizeGrip value={middleColumnWidth} onValueChange={setMiddleColumnWidth} />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">{middle}</div>
          </div>
        </aside>
      ) : null}
      {panel ? (
        <aside className="hidden h-full shrink-0 flex-col py-1.5 pr-1.5 pl-0 sm:flex">
          <div
            className={`flex h-full min-h-0 flex-col ${panelChromeClassName}`}
            style={{
              width: sidebarWidth,
              minWidth: SIDEBAR_WIDTH_MIN,
              maxWidth: SIDEBAR_WIDTH_MAX,
            }}
          >
            <ResizeGrip value={sidebarWidth} onValueChange={setSidebarWidth} />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg">
              {panel}
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  )
}
