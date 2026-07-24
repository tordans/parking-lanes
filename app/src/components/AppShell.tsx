import type { ReactNode } from 'react'

export function AppShell({ map, panel }: { map: ReactNode; panel: ReactNode }) {
  return (
    <div className="flex h-dvh w-full flex-col bg-zinc-100 font-sans antialiased lg:flex-row">
      <div className="relative min-h-0 min-w-0 flex-1">{map}</div>
      <aside className="flex w-full shrink-0 flex-col border-t border-zinc-950/5 bg-zinc-100 lg:h-full lg:w-96 lg:border-t-0 lg:p-2">
        <div className="flex max-h-[50vh] flex-col overflow-hidden bg-white lg:max-h-full lg:flex-1 lg:rounded-lg lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5">
          {panel}
        </div>
      </aside>
    </div>
  )
}
