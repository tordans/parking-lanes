import * as m from '@app/paraglide/messages'
import type { ReactNode } from 'react'
import { floatingChromeElevationClassName } from '../shell/map/mobileMapChrome.const'

const panelChromeClassName = `overflow-hidden rounded-lg bg-zinc-100 ${floatingChromeElevationClassName}`

function ResizeGrip({ edge }: { edge: 'top' | 'left' }) {
  return (
    <div
      className={
        edge === 'top'
          ? 'pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center'
          : 'pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center'
      }
      aria-hidden
    >
      <div
        className={
          edge === 'top' ? 'h-1.5 w-10 rounded-b bg-zinc-300' : 'h-10 w-1.5 rounded-r bg-zinc-300'
        }
        title={m.shell_drag_resize()}
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
  return (
    <div className="flex h-(--app-height,100dvh) w-full flex-col overflow-hidden overscroll-none bg-zinc-100 font-sans antialiased sm:flex-row">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
        {bottom ? (
          <div className="hidden shrink-0 p-2 pt-0 sm:block">
            <div
              className={`relative h-64 min-h-60 max-h-80 w-full resize-y ${panelChromeClassName}`}
            >
              <ResizeGrip edge="top" />
              {bottom}
            </div>
          </div>
        ) : null}
      </div>
      {panel ? (
        <aside className="hidden h-full shrink-0 flex-col p-2 sm:flex">
          <div
            className={`relative flex h-full min-h-0 w-96 min-w-72 max-w-xl resize-x flex-col ${panelChromeClassName}`}
          >
            <ResizeGrip edge="left" />
            {panel}
          </div>
        </aside>
      ) : null}
    </div>
  )
}
