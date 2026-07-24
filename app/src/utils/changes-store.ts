import { type OsmWay } from '@osm-editor-kit/osm-data'
import { countChanges, upsertChangedWay } from '../parking/domain/editor/changes'
import { type ChangesStore } from './types/changes-store'

export const changesStore: ChangesStore = {
  modify: {
    way: [],
  },
  create: {
    way: [],
  },
}

export function addChangedEntity(osm: OsmWay): number {
  upsertChangedWay(changesStore, osm)
  return countChanges(changesStore)
}
