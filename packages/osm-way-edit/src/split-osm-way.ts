import type { OsmWay } from '@osm-editor-kit/osm-data'

export type SplitOsmWayResult = {
  oldWay: OsmWay
  newWay: OsmWay
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

/** Interior nodes are required to place a cut (endpoints alone are not enough). */
export function wayHasSplittableInterior(way: OsmWay): boolean {
  return way.nodes.length >= 3
}
