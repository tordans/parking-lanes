import type { OsmWay } from '@osm-editor-kit/osm-data'
import { ModePanelIntro } from '../../../shell/controls/ModePanelIntro'

function segmentSummary(tags: Record<string, string>): string {
  const parts: string[] = []
  if (tags.lanes) parts.push(`${tags.lanes} lanes`)
  if (tags['lanes:forward']) parts.push(`${tags['lanes:forward']} fwd`)
  if (tags['lanes:backward']) parts.push(`${tags['lanes:backward']} bwd`)
  return parts.length > 0 ? parts.join(' · ') : 'No lane count'
}

export function LanesWaySummary({ way }: { way: OsmWay }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 text-zinc-900">
      <ModePanelIntro
        wayId={way.id}
        highway={way.tags.highway}
        className="flex items-center gap-2"
      />
      <div className="text-sm text-zinc-700">
        {way.tags.name ? <div className="font-medium text-zinc-900">{way.tags.name}</div> : null}
        {way.tags.ref ? <div className="text-zinc-500">{way.tags.ref}</div> : null}
        <div className="text-xs text-zinc-500">{segmentSummary(way.tags)}</div>
      </div>
    </div>
  )
}
