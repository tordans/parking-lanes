import type { OsmWay } from '@osm-editor-kit/osm-data'

function segmentSummary(tags: Record<string, string>): string {
  const parts: string[] = []
  if (tags.lanes) parts.push(`${tags.lanes} lanes`)
  if (tags['lanes:forward']) parts.push(`${tags['lanes:forward']} fwd`)
  if (tags['lanes:backward']) parts.push(`${tags['lanes:backward']} bwd`)
  return parts.length > 0 ? parts.join(' · ') : 'No lane count'
}

/** Compact lane-count line only — street name lives on cross-section columns. */
export function LanesWaySummary({ way }: { way: OsmWay }) {
  return <div className="text-xs text-zinc-500">{segmentSummary(way.tags)}</div>
}
