import type { ReactNode } from 'react'
import { floatingChromeElevationClassName } from '../shell/map/mobileMapChrome.const'

export function AppShell({ map, panel }: { map: ReactNode; panel: ReactNode }) {
  return (
    <div className="flex h-(--app-height,100dvh) w-full flex-col overflow-hidden overscroll-none bg-zinc-100 font-sans antialiased sm:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
      <aside className="hidden h-full w-96 shrink-0 flex-col p-2 sm:flex">
        <div
          className={`flex flex-1 flex-col overflow-hidden rounded-lg bg-zinc-100 ${floatingChromeElevationClassName}`}
        >
          {panel}
        </div>
      </aside>
    </div>
  )
}
