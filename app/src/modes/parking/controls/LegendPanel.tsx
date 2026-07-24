import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { legend } from '../legend'

export function LegendContent() {
  return (
    <div className="columns-2 gap-x-4">
      {legend.map((x) => (
        <div key={x.condition} className="mb-1 flex items-center gap-1.5 break-inside-avoid">
          <div className="h-0.5 w-4 shrink-0" style={{ backgroundColor: x.color }} />
          <span className="text-sm leading-tight">{x.text}</span>
        </div>
      ))}
    </div>
  )
}

export function LegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title="Legend" defaultOpen={false}>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
