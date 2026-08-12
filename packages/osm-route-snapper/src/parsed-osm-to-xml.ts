import type { OsmNode, OsmTags, OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function renderTags(tags: OsmTags) {
  return Object.entries(tags)
    .map(([key, value]) => `<tag k="${escapeXml(key)}" v="${escapeXml(value)}"/>`)
    .join('')
}

function renderNode(node: OsmNode) {
  return `<node id="${node.id}" lat="${node.lat}" lon="${node.lon}" version="${node.version}" changeset="${node.changeset}"/>`
}

function renderWay(way: OsmWay) {
  const nds = way.nodes.map((nodeId) => `<nd ref="${nodeId}"/>`).join('')
  return `<way id="${way.id}" version="${way.version}" changeset="${way.changeset}">${nds}${renderTags(way.tags)}</way>`
}

/** Minimal OSM XML for osm-to-route-snapper (highway ways + referenced nodes). */
export function parsedOsmToXml(data: ParsedOsmData) {
  const nodeIds = new Set<number>()
  for (const way of Object.values(data.ways)) {
    for (const nodeId of way.nodes) {
      nodeIds.add(nodeId)
    }
  }

  const nodes = [...nodeIds]
    .map((nodeId) => {
      const node = data.nodes[nodeId]
      if (node) return renderNode(node)
      const coords = data.nodeCoords[nodeId]
      if (!coords) return null
      return `<node id="${nodeId}" lat="${coords[0]}" lon="${coords[1]}" version="1" changeset="0"/>`
    })
    .filter((line): line is string => line != null)
    .join('')

  const ways = Object.values(data.ways).map(renderWay).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><osm version="0.6" generator="osm-route-snapper">${nodes}${ways}</osm>`
}
