import type { ReactNode } from 'react'

export function AppShell({ map, panel }: { map: ReactNode; panel: ReactNode }) {
  return (
    <div className="flex h-(--app-height,100dvh) w-full flex-col overflow-hidden overscroll-none bg-zinc-100 font-sans antialiased lg:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
      <aside className="hidden h-full w-96 shrink-0 flex-col p-2 lg:flex">
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-zinc-950/5">
          {panel}
        </div>
      </aside>
    </div>
  )
}
