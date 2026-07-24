import { type OsmWay } from '@osm-editor-kit/osm-data'
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

export function countChanges(store: ChangesStore): number {
  return store.modify.way.length + store.create.way.length
}
