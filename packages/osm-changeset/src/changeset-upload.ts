import { type OsmNode, type OsmWay } from '@osm-editor-kit/osm-data'
import {
  createOsmChangeXml,
  type OsmChange,
  type OsmNode as OsmApiNode,
  type OsmWay as OsmApiWay,
  type UploadResult,
} from 'osm-api'
import { type ChangedIdMap, type ChangesStore } from './changes-store'

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

function nodeToOsmApiFeature(node: OsmNode): OsmApiNode {
  return {
    type: 'node',
    id: node.id,
    version: node.version ?? 0,
    lat: node.lat,
    lon: node.lon,
    tags: node.tags,
    changeset: node.changeset ?? 0,
    timestamp: node.timestamp ?? '',
    user: node.user ?? '',
    uid: node.uid ?? 0,
  }
}

export function changesStoreToOsmChange(changesStore: ChangesStore): OsmChange {
  return {
    create: [
      ...changesStore.create.node.map(nodeToOsmApiFeature),
      ...changesStore.create.way.map(wayToOsmApiFeature),
    ],
    modify: [
      ...changesStore.modify.node.map(nodeToOsmApiFeature),
      ...changesStore.modify.way.map(wayToOsmApiFeature),
    ],
    delete: [],
  }
}

/** Build an osmChange XML document (`.osc`) via osm-api’s `createOsmChangeXml`. */
export function changesStoreToOsmChangeXml(
  changesStore: ChangesStore,
  options: { changesetId?: number; tags?: Record<string, string> } = {},
): string {
  return createOsmChangeXml(
    options.changesetId ?? 0,
    changesStoreToOsmChange(changesStore),
    options.tags,
  )
}

export function applyUploadResult(changesStore: ChangesStore, result: UploadResult): ChangedIdMap {
  const changedIdMap: ChangedIdMap = {}

  for (const changesetId of Object.keys(result)) {
    const diffResult = result[Number(changesetId)].diffResult
    const nodeDiff = diffResult.node
    const wayDiff = diffResult.way

    if (nodeDiff) {
      for (const [oldIdStr, mapping] of Object.entries(nodeDiff)) {
        const oldId = Number(oldIdStr)
        const node =
          changesStore.modify.node.find((x) => x.id === oldId) ??
          changesStore.create.node.find((x) => x.id === oldId)

        if (!node) continue

        node.id = mapping.newId
        node.version = mapping.newVersion

        if (oldId !== mapping.newId) changedIdMap[String(oldId)] = String(mapping.newId)
      }
    }

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

  for (const [oldIdStr, newIdStr] of Object.entries(changedIdMap)) {
    const oldId = Number(oldIdStr)
    const newId = Number(newIdStr)
    for (const way of [...changesStore.modify.way, ...changesStore.create.way]) {
      way.nodes = way.nodes.map((nodeId) => (nodeId === oldId ? newId : nodeId))
    }
  }

  changesStore.modify.way = []
  changesStore.create.way = []
  changesStore.modify.node = []
  changesStore.create.node = []

  return changedIdMap
}
