import type { ParsedOsmData } from '@osm-editor-kit/osm-data'
import type { Feature, FeatureCollection, LineString } from 'geojson'

function wayLineString(
  wayId: number,
  nodeIds: number[],
  nodeCoords: ParsedOsmData['nodeCoords'],
): Feature<LineString> | null {
  const coordinates: [number, number][] = []
  for (const nodeId of nodeIds) {
    const coords = nodeCoords[nodeId]
    if (!coords) continue
    coordinates.push([coords[1]!, coords[0]!])
  }
  if (coordinates.length < 2) return null

  return {
    type: 'Feature',
    properties: { osm_way_id: wayId },
    geometry: { type: 'LineString', coordinates },
  }
}

/** GeoJSON LineStrings for ways in the Overpass / session OSM cache. */
export function parsedOsmWaysToFeatureCollection(
  data: ParsedOsmData,
): FeatureCollection<LineString> {
  const features: Feature<LineString>[] = []
  for (const way of Object.values(data.ways)) {
    const feature = wayLineString(way.id, way.nodes, data.nodeCoords)
    if (feature) features.push(feature)
  }
  return { type: 'FeatureCollection', features }
}

export function countRoadWays(data: ParsedOsmData) {
  return Object.keys(data.ways).length
}

/** Stable signature so graph queries rebuild when coverage grows. */
export function coverageGraphSignature(data: ParsedOsmData) {
  return [
    Object.keys(data.ways).length,
    Object.keys(data.nodes).length,
    Object.keys(data.nodeCoords).length,
  ].join(':')
}
