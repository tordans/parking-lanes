import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { legend } from '../legend'

export function LegendContent() {
  return (
    <div className="flex flex-col gap-1">
      {legend.map((x) => (
        <div key={x.condition} className="flex items-center gap-2">
          <div className="h-0.5 w-7 shrink-0" style={{ backgroundColor: x.color }} />
          <span>{x.text}</span>
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
