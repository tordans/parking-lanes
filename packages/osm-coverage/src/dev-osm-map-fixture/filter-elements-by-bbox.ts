import type { MapBbox, OsmMapElement } from './types'

export type OsmMapFixtureIndex = {
  nodesById: Map<number, OsmMapElement>
  waysById: Map<number, OsmMapElement>
  relationsById: Map<number, OsmMapElement>
  wayIdsByNodeId: Map<number, number[]>
  nodeIdsInBbox: (bbox: MapBbox) => number[]
}

/** Map-API-like bbox slice: nodes in bbox, connected ways + all their nodes, then relations. */
export function filterElementsByBbox(index: OsmMapFixtureIndex, bbox: MapBbox): OsmMapElement[] {
  const nodeIdsInBbox = new Set(index.nodeIdsInBbox(bbox))
  if (nodeIdsInBbox.size === 0) return []

  const includedNodeIds = new Set<number>()
  const includedWayIds = new Set<number>()

  for (const nodeId of nodeIdsInBbox) {
    includedNodeIds.add(nodeId)
  }

  for (const nodeId of nodeIdsInBbox) {
    const wayIds = index.wayIdsByNodeId.get(nodeId)
    if (!wayIds) continue
    for (const wayId of wayIds) {
      includedWayIds.add(wayId)
    }
  }

  for (const wayId of includedWayIds) {
    const way = index.waysById.get(wayId)
    if (!way?.nodes) continue
    for (const nodeId of way.nodes) {
      includedNodeIds.add(nodeId)
    }
  }

  const includedRelationIds = new Set<number>()
  for (const relation of index.relationsById.values()) {
    if (!relation.members) continue
    const referencesIncluded = relation.members.some(
      (member) =>
        (member.type === 'node' && includedNodeIds.has(member.ref)) ||
        (member.type === 'way' && includedWayIds.has(member.ref)),
    )
    if (referencesIncluded) {
      includedRelationIds.add(relation.id)
    }
  }

  const elements: OsmMapElement[] = []
  for (const nodeId of includedNodeIds) {
    const node = index.nodesById.get(nodeId)
    if (node) elements.push(node)
  }
  for (const wayId of includedWayIds) {
    const way = index.waysById.get(wayId)
    if (way) elements.push(way)
  }
  for (const relationId of includedRelationIds) {
    const relation = index.relationsById.get(relationId)
    if (relation) elements.push(relation)
  }

  return elements
}
