import { countChanges, upsertChangedWay } from '../parking/domain/editor/changes'
import { type ChangesStore } from './types/changes-store'
import { type OsmWay } from './types/osm-data'

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
