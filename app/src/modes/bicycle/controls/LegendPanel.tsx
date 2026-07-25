import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { bicycleLegendItems } from '../map/bicycle-colors'

export function LegendContent() {
  return (
    <div className="flex flex-col gap-2">
      {bicycleLegendItems.map((item) => (
        <div key={item.paintState} className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-sm leading-tight text-zinc-800">{item.label}</span>
        </div>
      ))}
      <p className="m-0 text-xs text-zinc-600">
        Centerline presence tags: <code className="text-zinc-800">cycleway(:side)=separate</code>,{' '}
        <code className="text-zinc-800">bicycle(:side)=use_sidepath</code> or{' '}
        <code className="text-zinc-800">optional_sidepath</code>.
      </p>
    </div>
  )
}

export function BicycleLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title="Legend" defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
