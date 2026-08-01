import { wayDisplayName } from '@osm-editor-kit/osm-changeset'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { StreetSpaceModeId } from '../modes/types'

export type ChangeSource = StreetSpaceModeId | 'split'

const MODE_ORDER: StreetSpaceModeId[] = [
  'parking',
  'width',
  'bicycle',
  'lanes',
  'table',
  'surface',
  'sidewalks',
]

const MODE_LABELS: Record<StreetSpaceModeId, string> = {
  parking: 'parking',
  width: 'width',
  bicycle: 'bicycle',
  lanes: 'lanes',
  table: 'table',
  surface: 'surface',
  sidewalks: 'sidewalks',
}

export function wayHasStreetName(way: OsmWay): boolean {
  return Boolean(way.tags.name?.trim() || way.tags.ref?.trim())
}

export function orderedModeLabels(sources: Iterable<ChangeSource>): string[] {
  const modeSet = new Set<StreetSpaceModeId>()
  for (const source of sources) {
    if (source !== 'split') modeSet.add(source)
  }

  return MODE_ORDER.filter((id) => modeSet.has(id)).map((id) => MODE_LABELS[id])
}

/** Ordered sources for UI chips/icons (modes in registry order, then split). */
export function orderedChangeSources(sources: Iterable<ChangeSource>): ChangeSource[] {
  const sourceSet = new Set(sources)
  const ordered: ChangeSource[] = MODE_ORDER.filter((id) => sourceSet.has(id))
  if (sourceSet.has('split')) ordered.push('split')
  return ordered
}

/** Human labels for pending-change source chips (modes + split). */
export function changeSourceLabels(sources: Iterable<ChangeSource>): string[] {
  return orderedChangeSources(sources).map((source) =>
    source === 'split' ? 'split' : MODE_LABELS[source],
  )
}

export function changeSourceLabel(source: ChangeSource): string {
  return source === 'split' ? 'split' : MODE_LABELS[source]
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
