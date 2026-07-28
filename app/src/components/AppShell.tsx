import * as m from '@app/paraglide/messages'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { floatingChromeElevationClassName } from '../shell/map/mobileMapChrome.const'
import {
  BOTTOM_PANEL_HEIGHT_MAX,
  BOTTOM_PANEL_HEIGHT_MIN,
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  useBottomPanelHeight,
  useShellPanelActions,
  useSidebarWidth,
} from '../shell/shell-panel-store'

const panelChromeClassName = `relative rounded-lg bg-zinc-100 ${floatingChromeElevationClassName}`

function ResizeGrip({
  edge,
  value,
  onValueChange,
}: {
  edge: 'top' | 'left'
  value: number
  onValueChange: (next: number) => void
}) {
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    const target = event.currentTarget
    const origin = edge === 'top' ? event.clientY : event.clientX
    const startValue = value
    target.setPointerCapture(event.pointerId)

    function onPointerMove(moveEvent: PointerEvent) {
      const current = edge === 'top' ? moveEvent.clientY : moveEvent.clientX
      // Top: drag up → taller. Left: drag left → wider.
      onValueChange(startValue + (origin - current))
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
      aria-orientation={edge === 'top' ? 'horizontal' : 'vertical'}
      aria-label={m.shell_drag_resize()}
      title={m.shell_drag_resize()}
      onPointerDown={handlePointerDown}
      className={
        edge === 'top'
          ? 'group absolute top-0 left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-ns-resize items-center justify-center px-3 py-2 touch-none'
          : 'group absolute top-1/2 left-0 z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center px-2 py-3 touch-none'
      }
    >
      <div
        className={
          edge === 'top'
            ? 'h-1.5 w-10 rounded-full bg-zinc-400/30 transition-colors group-hover:bg-zinc-500/70 group-active:bg-zinc-600/80'
            : 'h-10 w-1.5 rounded-full bg-zinc-400/30 transition-colors group-hover:bg-zinc-500/70 group-active:bg-zinc-600/80'
        }
      />
    </div>
  )
}

export function AppShell({
  map,
  panel,
  bottom,
}: {
  map: ReactNode
  panel?: ReactNode
  bottom?: ReactNode
}) {
  const sidebarWidth = useSidebarWidth()
  const bottomPanelHeight = useBottomPanelHeight()
  const { setSidebarWidth, setBottomPanelHeight } = useShellPanelActions()

  return (
    <div className="flex h-(--app-height,100dvh) w-full flex-col overflow-hidden overscroll-none bg-zinc-100 font-sans antialiased sm:flex-row">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
        {bottom ? (
          <div className="hidden shrink-0 px-1.5 pt-0 pb-1.5 sm:block">
            <div
              className={`w-full ${panelChromeClassName}`}
              style={{
                height: bottomPanelHeight,
                minHeight: BOTTOM_PANEL_HEIGHT_MIN,
                maxHeight: BOTTOM_PANEL_HEIGHT_MAX,
              }}
            >
              <ResizeGrip
                edge="top"
                value={bottomPanelHeight}
                onValueChange={setBottomPanelHeight}
              />
              <div className="h-full overflow-hidden rounded-lg">{bottom}</div>
            </div>
          </div>
        ) : null}
      </div>
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
            <ResizeGrip edge="left" value={sidebarWidth} onValueChange={setSidebarWidth} />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">{panel}</div>
          </div>
        </aside>
      ) : null}
    </div>
  )
}
