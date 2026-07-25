import {
  countChanges,
  createEmptyChangesStore,
  removeChangedWay,
  upsertChangedNode,
  upsertChangedWay,
} from '@osm-editor-kit/osm-changeset'
import { type OsmNode, type OsmWay } from '@osm-editor-kit/osm-data'
import { type ChangeSource, diffWayTags, type TagChange, wayDisplayName } from './changeset-message'

export type PendingChange = {
  way: OsmWay
  original: OsmWay | null
  sources: ChangeSource[]
  tagChanges: TagChange[]
  displayName: string
}

type PendingMeta = {
  original: OsmWay | null
  sources: Set<ChangeSource>
}

export const changesStore = createEmptyChangesStore()

const pendingMeta = new Map<number, PendingMeta>()

function cloneWay(way: OsmWay): OsmWay {
  return {
    ...way,
    nodes: [...way.nodes],
    tags: { ...way.tags },
  }
}

/** Latest pending way for an id, if any (modify or create bucket). */
export function getPendingWay(wayId: number): OsmWay | null {
  const modified = changesStore.modify.way.find((way) => way.id === wayId)
  if (modified) return modified
  return changesStore.create.way.find((way) => way.id === wayId) ?? null
}

export function addChangedEntity(
  osm: OsmWay,
  options: { original?: OsmWay | null; source?: ChangeSource } = {},
): number {
  const existing = pendingMeta.get(osm.id)
  if (!existing) {
    pendingMeta.set(osm.id, {
      original: options.original ? cloneWay(options.original) : null,
      sources: new Set(options.source ? [options.source] : []),
    })
  } else if (options.source) {
    existing.sources.add(options.source)
  }

  upsertChangedWay(changesStore, osm)
  return countChanges(changesStore)
}

export function addChangedNode(osm: OsmNode): number {
  upsertChangedNode(changesStore, osm)
  return countChanges(changesStore)
}

/** Removes a pending change. Returns the original way to restore, or `null` for creates. */
export function removeChangedEntity(wayId: number): {
  original: OsmWay | null
  wasCreate: boolean
  count: number
} {
  removeChangedWay(changesStore, wayId)
  const meta = pendingMeta.get(wayId)
  pendingMeta.delete(wayId)
  return {
    original: meta?.original ?? null,
    wasCreate: wayId < 0,
    count: countChanges(changesStore),
  }
}

export function listPendingChanges(): PendingChange[] {
  const ways = [...changesStore.modify.way, ...changesStore.create.way]
  return ways.map((way) => {
    const meta = pendingMeta.get(way.id)
    const original = meta?.original ?? null
    return {
      way,
      original,
      sources: meta ? [...meta.sources] : [],
      tagChanges: diffWayTags(original, way),
      displayName: wayDisplayName(way),
    }
  })
}

export function allPendingSources(): ChangeSource[] {
  const sources = new Set<ChangeSource>()
  for (const meta of pendingMeta.values()) {
    for (const source of meta.sources) sources.add(source)
  }
  return [...sources]
}

export function clearChanges(): number {
  changesStore.modify.way.length = 0
  changesStore.create.way.length = 0
  changesStore.modify.node.length = 0
  changesStore.create.node.length = 0
  pendingMeta.clear()
  return 0
}
