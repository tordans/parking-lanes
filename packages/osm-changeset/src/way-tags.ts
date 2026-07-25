import type { OsmWay } from '@osm-editor-kit/osm-data'

export type TagChange = {
  key: string
  from: string | null
  to: string | null
}

export function wayDisplayName(way: OsmWay): string {
  const name = way.tags.name?.trim()
  if (name) return name
  const ref = way.tags.ref?.trim()
  if (ref) return ref
  return `way ${way.id}`
}

export function diffWayTags(original: OsmWay | null, current: OsmWay): TagChange[] {
  const fromTags = original?.tags ?? {}
  const toTags = current.tags
  const keys = new Set([...Object.keys(fromTags), ...Object.keys(toTags)])
  const changes: TagChange[] = []

  for (const key of [...keys].sort()) {
    const from = fromTags[key] ?? null
    const to = toTags[key] ?? null
    if (from === to) continue
    changes.push({ key, from, to })
  }

  return changes
}
