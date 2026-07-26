import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { lanesLegendItems } from '../map/lanes-legend-colors'

export function LegendContent() {
  return (
    <div className="flex flex-col gap-1">
      {lanesLegendItems.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-sm leading-tight text-zinc-800">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function LanesLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title="Legend" defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
