import { type OsmNode, type OsmRelation, type OsmWay } from '@osm-editor-kit/osm-data'

interface EditTypeStore {
  way: OsmWay[]
  node: OsmNode[]
  relation: OsmRelation[]
}

export interface ChangesStore {
  modify: EditTypeStore
  create: EditTypeStore
}

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface ChangedIdMap {
  [oldId: string]: string
}

export function createEmptyChangesStore(): ChangesStore {
  return {
    modify: { way: [], node: [], relation: [] },
    create: { way: [], node: [], relation: [] },
  }
}
