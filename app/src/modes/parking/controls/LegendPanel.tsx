import * as m from '@app/paraglide/messages'
import { getParkingLegendText } from '../../../i18n/legend-labels'
import { LegendBoundariesEntry } from '../../../shell/controls/LegendBoundariesEntry'
import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { MissingDataLegendLine } from '../../../shell/controls/MissingDataLegendLine'
import { legend } from '../legend'

export function LegendContent() {
  return (
    <div className="columns-2 gap-x-4">
      <div className="mb-1 break-inside-avoid">
        <MissingDataLegendLine>{m.legend_parking_missing()}</MissingDataLegendLine>
      </div>
      {legend.map((x) => (
        <div key={x.condition} className="mb-1 flex items-center gap-1.5 break-inside-avoid">
          <div className="h-0.5 w-4 shrink-0" style={{ backgroundColor: x.color }} />
          <span className="text-sm leading-tight">{getParkingLegendText(x.condition)}</span>
        </div>
      ))}
      <LegendBoundariesEntry />
    </div>
  )
}

export function LegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title={m.shell_legend_title()} defaultOpen={false}>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
