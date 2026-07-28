import * as m from '@app/paraglide/messages'
import { getWidthLegendAfter, getWidthLegendBefore } from '../../../i18n/legend-labels'
import { LegendBoundariesEntry } from '../../../shell/controls/LegendBoundariesEntry'
import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import { MissingDataLegendSwatch } from '../../../shell/controls/MissingDataLegendSwatch'
import { HIGHWAY_WIDTH_NO_ONEWAY, HIGHWAY_WIDTH_ONEWAY } from '../domain/highway-width-fallbacks'
import { widthLegendItems } from '../map/width-colors'

function formatMeters(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

const highwayTypes = Object.keys(HIGHWAY_WIDTH_NO_ONEWAY)

function DefaultWidthRulesContent() {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-xs text-zinc-600">{m.legend_width_rules_intro()}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs text-zinc-800">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-1 pr-2 font-medium">highway</th>
              <th className="py-1 pr-2 font-medium">two-way</th>
              <th className="py-1 font-medium">oneway</th>
            </tr>
          </thead>
          <tbody>
            {highwayTypes.map((highway) => (
              <tr key={highway} className="border-b border-zinc-100 last:border-0">
                <td className="py-0.5 pr-2 font-mono">{highway}</td>
                <td className="py-0.5 pr-2 tabular-nums">
                  {formatMeters(HIGHWAY_WIDTH_NO_ONEWAY[highway]!)}&nbsp;m
                </td>
                <td className="py-0.5 tabular-nums">
                  {formatMeters(HIGHWAY_WIDTH_ONEWAY[highway]!)}&nbsp;m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const tagClassName = 'font-mono text-zinc-800'

function WidthLegendLabel({
  before,
  tags,
  after,
}: {
  before: string
  tags: readonly string[]
  after?: string
}) {
  return (
    <span className="text-sm leading-tight">
      {before}{' '}
      {tags.map((tag, index) => (
        <span key={tag}>
          {index > 0 ? ' / ' : null}
          <code className={tagClassName}>{tag}</code>
        </span>
      ))}
      {after ? ` ${after}` : null}
    </span>
  )
}

export function LegendContent() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        {widthLegendItems.map((item) => (
          <div key={item.kind} className="flex items-center gap-1.5">
            {'missing' in item && item.missing ? (
              <MissingDataLegendSwatch />
            ) : (
              <div className="h-0.5 w-4 shrink-0" style={{ backgroundColor: item.color }} />
            )}
            <WidthLegendLabel
              before={getWidthLegendBefore(item.kind)}
              tags={item.tags}
              after={getWidthLegendAfter(item.kind)}
            />
          </div>
        ))}
      </div>
      <MapCollapsiblePanel title={m.legend_width_rules_title()} defaultOpen={false}>
        <DefaultWidthRulesContent />
      </MapCollapsiblePanel>
      <LegendBoundariesEntry />
    </div>
  )
}

export function WidthLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title={m.shell_legend_title()} defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
