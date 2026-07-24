import {
  countChanges,
  createEmptyChangesStore,
  upsertChangedWay,
} from '@osm-editor-kit/osm-changeset'
import { type OsmWay } from '@osm-editor-kit/osm-data'

export const changesStore = createEmptyChangesStore()

export function addChangedEntity(osm: OsmWay): number {
  upsertChangedWay(changesStore, osm)
  return countChanges(changesStore)
}

export function clearChanges(): number {
  changesStore.modify.way.length = 0
  changesStore.create.way.length = 0
  return 0
}
