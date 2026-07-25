import type { OsmNode, OsmWay } from '@osm-editor-kit/osm-data'

export type SplitOsmWayResult = {
  oldWay: OsmWay
  newWay: OsmWay
}

export type InsertNodeOnWaySegmentResult = {
  wayWithNode: OsmWay
  newNode: OsmNode
}

/**
 * Split `way` at an existing node. The original way keeps nodes up to and including
 * the split node; the new way starts at that node and continues to the end.
 * Endpoints cannot be split (returns null).
 */
export function splitOsmWayAtNode(
  way: OsmWay,
  nodeId: number,
  newWayId: number,
): SplitOsmWayResult | null {
  const ndIndex = way.nodes.findIndex((node) => node === nodeId)
  if (ndIndex <= 0 || ndIndex >= way.nodes.length - 1) return null

  const originalNodes = [...way.nodes]
  const oldWay: OsmWay = {
    ...way,
    nodes: originalNodes.slice(0, ndIndex + 1),
  }

  const newWay: OsmWay = {
    ...structuredClone(way),
    nodes: originalNodes.slice(ndIndex),
    id: newWayId,
    version: 1,
  }
  delete newWay.user
  delete newWay.uid
  delete newWay.timestamp

  return { oldWay, newWay }
}

/** Ways need at least two nodes to split (including mid-line insert on a segment). */
export function wayCanSplit(way: OsmWay): boolean {
  return way.nodes.length >= 2
}

/** Interior nodes are required to place a cut marker (endpoints alone are not enough). */
export function wayHasSplittableInterior(way: OsmWay): boolean {
  return way.nodes.length >= 3
}

/**
 * Insert a new node on the segment starting at `segmentIndex` (between
 * `way.nodes[segmentIndex]` and `way.nodes[segmentIndex + 1]`).
 */
export function insertNodeOnWaySegment(
  way: OsmWay,
  segmentIndex: number,
  coords: { lat: number; lon: number },
  newNodeId: number,
): InsertNodeOnWaySegmentResult | null {
  if (segmentIndex < 0 || segmentIndex >= way.nodes.length - 1) return null

  const newNode: OsmNode = {
    type: 'node',
    id: newNodeId,
    lat: coords.lat,
    lon: coords.lon,
    version: 1,
    changeset: 0,
    tags: {},
  }

  const nodes = [...way.nodes]
  nodes.splice(segmentIndex + 1, 0, newNodeId)

  return {
    wayWithNode: { ...way, nodes },
    newNode,
  }
}
