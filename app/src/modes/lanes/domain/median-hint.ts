import type { OsmTags, ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { RoadSpaceMedianHint } from '@osm-editor-kit/osm-lane-diagram'

function isCrossingNodeTags(tags: OsmTags | undefined): boolean {
  if (!tags) return false
  if (tags.highway?.toLowerCase() === 'crossing') return true
  if (tags.footway?.toLowerCase() === 'crossing') return true
  if (tags.cycleway?.toLowerCase() === 'crossing') return true
  if (tags.path?.toLowerCase() === 'crossing') return true
  if (tags.crossing != null && tags.crossing.toLowerCase() !== 'no') return true
  return false
}

/**
 * Whether any node along the way is a pedestrian/cycle crossing.
 * Used to pick a crossing island icon in the dual-carriageway median gap.
 */
export function wayHasCrossingNode(graph: ParsedOsmData, wayId: number): boolean {
  const way = graph.ways[wayId]
  if (!way) return false
  for (const nodeId of way.nodes) {
    if (isCrossingNodeTags(graph.nodes[nodeId]?.tags)) return true
  }
  return false
}

export function medianHintForWay(
  graph: ParsedOsmData | undefined,
  wayId: number,
): RoadSpaceMedianHint {
  if (graph && wayHasCrossingNode(graph, wayId)) return 'crossing'
  return 'verge'
}
