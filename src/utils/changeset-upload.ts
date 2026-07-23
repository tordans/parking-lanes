import { type OsmChange, type OsmWay as OsmApiWay, type UploadResult } from 'osm-api'
import { type ChangedIdMap, type ChangesStore } from './types/changes-store'
import { type OsmWay } from './types/osm-data'

function wayToOsmApiFeature(way: OsmWay): OsmApiWay {
  return {
    type: 'way',
    id: way.id,
    version: way.version ?? 0,
    nodes: way.nodes,
    tags: way.tags,
    changeset: way.changeset ?? 0,
    timestamp: way.timestamp ?? '',
    user: way.user ?? '',
    uid: way.uid ?? 0,
  }
}

export function changesStoreToOsmChange(changesStore: ChangesStore): OsmChange {
  return {
    create: changesStore.create.way.map(wayToOsmApiFeature),
    modify: changesStore.modify.way.map(wayToOsmApiFeature),
    delete: [],
  }
}

export function applyUploadResult(changesStore: ChangesStore, result: UploadResult): ChangedIdMap {
  const changedIdMap: ChangedIdMap = {}

  for (const changesetId of Object.keys(result)) {
    const wayDiff = result[Number(changesetId)].diffResult.way
    if (!wayDiff) continue

    for (const [oldIdStr, mapping] of Object.entries(wayDiff)) {
      const oldId = Number(oldIdStr)
      const way =
        changesStore.modify.way.find((x) => x.id === oldId) ??
        changesStore.create.way.find((x) => x.id === oldId)

      if (!way) continue

      way.id = mapping.newId
      way.version = mapping.newVersion

      if (oldId !== mapping.newId) changedIdMap[String(oldId)] = String(mapping.newId)
    }
  }

  changesStore.modify.way = []
  changesStore.create.way = []

  return changedIdMap
}
