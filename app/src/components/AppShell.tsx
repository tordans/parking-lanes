import * as m from '@app/paraglide/messages'
import type { ReactNode } from 'react'
import { floatingChromeElevationClassName } from '../shell/map/mobileMapChrome.const'

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
          <div className="relative hidden min-h-60 max-h-80 shrink-0 resize-y overflow-hidden border-t border-zinc-200 bg-white sm:block">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
              aria-hidden
            >
              <div className="h-1.5 w-10 rounded-b bg-zinc-300" title={m.shell_drag_resize()} />
            </div>
            {bottom}
          </div>
        ) : null}
      </div>
      {panel ? (
        <aside className="hidden h-full w-96 shrink-0 flex-col p-2 sm:flex">
          <div
            className={`flex flex-1 flex-col overflow-hidden rounded-lg bg-zinc-100 ${floatingChromeElevationClassName}`}
          >
            {panel}
          </div>
        </aside>
      ) : null}
    </div>
  )
}
