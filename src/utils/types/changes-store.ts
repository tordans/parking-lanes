import { type OsmWay } from './osm-data'

interface EditTypeStore {
    way: OsmWay[]
}

export interface ChangesStore {
    modify: EditTypeStore
    create: EditTypeStore
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ChangedIdMap {
    [oldId: string]: string
}
