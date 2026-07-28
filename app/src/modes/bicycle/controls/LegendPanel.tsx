import * as m from '@app/paraglide/messages'
import { getBicycleLegendItems } from '../../../i18n/legend-labels'
import { LegendBoundariesEntry } from '../../../shell/controls/LegendBoundariesEntry'
import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { MissingDataLegendLine } from '../../../shell/controls/MissingDataLegendLine'
import { bicycleLegendItems } from '../map/bicycle-colors'

const colorByPaintState = Object.fromEntries(
  bicycleLegendItems.map((item) => [item.paintState, item.color]),
) as Record<(typeof bicycleLegendItems)[number]['paintState'], string>

const missingByPaintState = Object.fromEntries(
  bicycleLegendItems.map((item) => [item.paintState, 'missing' in item && item.missing === true]),
) as Record<(typeof bicycleLegendItems)[number]['paintState'], boolean>

export function LegendContent() {
  return (
    <div className="flex flex-col gap-2">
      {getBicycleLegendItems().map((item) =>
        missingByPaintState[item.paintState] ? (
          <MissingDataLegendLine key={item.paintState}>{item.label}</MissingDataLegendLine>
        ) : (
          <div key={item.paintState} className="flex items-center gap-1.5">
            <div
              className="h-0.5 w-4 shrink-0"
              style={{ backgroundColor: colorByPaintState[item.paintState] }}
            />
            <span className="text-sm leading-tight text-zinc-800">{item.label}</span>
          </div>
        ),
      )}
      <p className="m-0 text-xs text-zinc-600">
        Centerline presence tags: <code className="text-zinc-800">cycleway(:side)=separate</code>,{' '}
        <code className="text-zinc-800">bicycle(:side)=use_sidepath</code> or{' '}
        <code className="text-zinc-800">optional_sidepath</code>.
      </p>
      <LegendBoundariesEntry />
    </div>
  )
}

export function BicycleLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title={m.shell_legend_title()} defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
