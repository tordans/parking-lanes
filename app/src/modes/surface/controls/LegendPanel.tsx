import * as m from '@app/paraglide/messages'
import { getSurfaceLegendItems } from '../../../i18n/legend-labels'
import { LegendBoundariesEntry } from '../../../shell/controls/LegendBoundariesEntry'
import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { surfaceLegendItems } from '../map/surface-colors'

function LegendSwatch({ color, dotted }: { color: string; dotted?: boolean }) {
  if (dotted) {
    return (
      <span className="relative inline-flex h-0.5 w-4 shrink-0 items-center">
        <span className="absolute inset-x-0 h-0.5" style={{ backgroundColor: color }} />
        <span
          className="absolute inset-x-0 h-0.5"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 5px)`,
          }}
        />
      </span>
    )
  }

  return <span className="inline-block h-0.5 w-4 shrink-0" style={{ backgroundColor: color }} />
}

const legendMetaById = Object.fromEntries(
  surfaceLegendItems.map((item) => [
    item.id,
    { color: item.color, dotted: 'dotted' in item ? item.dotted : false },
  ]),
) as Record<(typeof surfaceLegendItems)[number]['id'], { color: string; dotted: boolean }>

export function LegendContent() {
  return (
    <div className="flex flex-col gap-1">
      {getSurfaceLegendItems().map((item) => {
        const meta = legendMetaById[item.id]
        return (
          <div key={item.id} className="flex items-center gap-1.5">
            <LegendSwatch color={meta.color} dotted={meta.dotted} />
            <span className="text-sm leading-tight text-zinc-800">{item.label}</span>
          </div>
        )
      })}
      <LegendBoundariesEntry />
    </div>
  )
}

export function SurfaceLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title={m.shell_legend_title()} defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
