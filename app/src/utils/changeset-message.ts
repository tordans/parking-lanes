import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { StreetSpaceModeId } from '../modes/types'

export type ChangeSource = StreetSpaceModeId | 'split'

export type TagChange = {
  key: string
  from: string | null
  to: string | null
}

const MODE_ORDER: StreetSpaceModeId[] = ['parking', 'width', 'lanes', 'surface', 'sidewalks']

const MODE_LABELS: Record<StreetSpaceModeId, string> = {
  parking: 'parking',
  width: 'width',
  lanes: 'lanes',
  surface: 'surface',
  sidewalks: 'sidewalks',
}

export function wayDisplayName(way: OsmWay): string {
  const name = way.tags.name?.trim()
  if (name) return name
  const ref = way.tags.ref?.trim()
  if (ref) return ref
  return `way ${way.id}`
}

export function wayHasStreetName(way: OsmWay): boolean {
  return Boolean(way.tags.name?.trim() || way.tags.ref?.trim())
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

export function orderedModeLabels(sources: Iterable<ChangeSource>): string[] {
  const modeSet = new Set<StreetSpaceModeId>()
  for (const source of sources) {
    if (source !== 'split') modeSet.add(source)
  }

  return MODE_ORDER.filter((id) => modeSet.has(id)).map((id) => MODE_LABELS[id])
}

/** Auto changeset comment: modes + up to three longest road names. */
export function buildChangesetComment(ways: OsmWay[], sources: Iterable<ChangeSource>): string {
  const modeLabels = orderedModeLabels(sources)
  const modePart = modeLabels.length > 0 ? modeLabels.join(', ') : 'data'

  const named = ways
    .filter(wayHasStreetName)
    .map(wayDisplayName)
    .sort((a, b) => b.length - a.length || a.localeCompare(b))

  const uniqueNames = [...new Set(named)]
  const top = uniqueNames.slice(0, 3)

  if (top.length === 0) {
    const count = ways.length
    return `Update street space ${modePart} for ${count} way${count === 1 ? '' : 's'}`
  }

  const hasOther = ways.length > top.length
  const roadsPart = top.join(', ')
  const otherPart = hasOther ? ' and other' : ''
  return `Update street space ${modePart} for ways ${roadsPart}${otherPart}`
}
