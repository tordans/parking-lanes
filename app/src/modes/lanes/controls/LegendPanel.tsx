import * as m from '@app/paraglide/messages'
import { getLanesLegendItems } from '../../../i18n/legend-labels'
import { LegendBoundariesEntry } from '../../../shell/controls/LegendBoundariesEntry'
import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { lanesLegendItems } from '../map/lanes-legend-colors'

const colorById = Object.fromEntries(
  lanesLegendItems.map((item) => [item.id, item.color]),
) as Record<(typeof lanesLegendItems)[number]['id'], string>

export function LegendContent() {
  return (
    <div className="flex flex-col gap-1">
      {getLanesLegendItems().map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 shrink-0" style={{ backgroundColor: colorById[item.id] }} />
          <span className="text-sm leading-tight text-zinc-800">{item.label}</span>
        </div>
      ))}
      <LegendBoundariesEntry />
    </div>
  )
}

export function LanesLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title={m.shell_legend_title()} defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
