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

export function LegendContent() {
  return (
    <div className="flex flex-col gap-1">
      {surfaceLegendItems.map((item) => (
        <div key={item.id} className="flex items-center gap-1.5">
          <LegendSwatch color={item.color} dotted={'dotted' in item ? item.dotted : false} />
          <span className="text-sm leading-tight text-zinc-800">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function SurfaceLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title="Legend" defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
