import { MapCollapsiblePanel } from '../../../shell/controls/MapCollapsiblePanel'
import {
  DEFAULT_FALLBACK,
  HIGHWAY_WIDTH_NO_ONEWAY,
  HIGHWAY_WIDTH_ONEWAY,
} from '../domain/highway-width-fallbacks'
import { widthLegendItems } from '../map/width-colors'

function formatMeters(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

const highwayTypes = Object.keys(HIGHWAY_WIDTH_NO_ONEWAY)

function DefaultWidthRulesContent() {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-xs text-zinc-600">
        Used when a way has no parseable <code className="text-zinc-800">width</code> or{' '}
        <code className="text-zinc-800">est_width</code>. The oneway column applies for one-way
        motor traffic: <code className="text-zinc-800">oneway=yes</code> or{' '}
        <code className="text-zinc-800">-1</code>, implicit on{' '}
        <code className="text-zinc-800">motorway</code>/
        <code className="text-zinc-800">motorway_link</code> and{' '}
        <code className="text-zinc-800">junction=roundabout</code>, or{' '}
        <code className="text-zinc-800">oneway:bicycle=no</code> on a one-way road. Unknown highway
        types use {formatMeters(DEFAULT_FALLBACK)}&nbsp;m.
      </p>
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
            <div className="h-0.5 w-4 shrink-0" style={{ backgroundColor: item.color }} />
            <WidthLegendLabel
              before={item.before}
              tags={item.tags}
              after={'after' in item ? item.after : undefined}
            />
          </div>
        ))}
      </div>
      <MapCollapsiblePanel title="Default width rules" defaultOpen={false}>
        <DefaultWidthRulesContent />
      </MapCollapsiblePanel>
    </div>
  )
}

export function WidthLegendPanel({ variant = 'floating' }: { variant?: 'floating' | 'inline' }) {
  if (variant === 'inline') {
    return <LegendContent />
  }

  return (
    <MapCollapsiblePanel title="Legend" defaultOpen>
      <LegendContent />
    </MapCollapsiblePanel>
  )
}
