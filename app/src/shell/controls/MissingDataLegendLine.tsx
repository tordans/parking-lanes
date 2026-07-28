import type { ReactNode } from 'react'
import { MissingDataLegendSwatch } from './MissingDataLegendSwatch'

/** Shared legend row for missing / untagged map data. */
export function MissingDataLegendLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 break-inside-avoid">
      <MissingDataLegendSwatch />
      <span className="text-sm leading-tight text-zinc-800">{children}</span>
    </div>
  )
}
