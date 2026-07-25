import { type OsmNode, type OsmWay } from '@osm-editor-kit/osm-data'
import { type ChangesStore } from './changes-store'

export function upsertChangedWay(store: ChangesStore, osm: OsmWay): void {
  if (osm.id > 0) {
    const index = store.modify.way.findIndex((x) => x.id === osm.id)
    if (index > -1) store.modify.way[index] = osm
    else store.modify.way.push(osm)
  } else {
    const index = store.create.way.findIndex((x) => x.id === osm.id)
    if (index > -1) store.create.way[index] = osm
    else store.create.way.push(osm)
  }
}

export function upsertChangedNode(store: ChangesStore, osm: OsmNode): void {
  if (osm.id > 0) {
    const index = store.modify.node.findIndex((x) => x.id === osm.id)
    if (index > -1) store.modify.node[index] = osm
    else store.modify.node.push(osm)
  } else {
    const index = store.create.node.findIndex((x) => x.id === osm.id)
    if (index > -1) store.create.node[index] = osm
    else store.create.node.push(osm)
  }
}

export function removeChangedWay(store: ChangesStore, wayId: number): OsmWay | null {
  const bucket = wayId > 0 ? store.modify.way : store.create.way
  const index = bucket.findIndex((x) => x.id === wayId)
  if (index < 0) return null
  const [removed] = bucket.splice(index, 1)
  return removed ?? null
}

export function countChanges(store: ChangesStore): number {
  return (
    store.modify.way.length +
    store.create.way.length +
    store.modify.node.length +
    store.create.node.length
  )
}
