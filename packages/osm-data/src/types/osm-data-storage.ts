import { type OsmNode, type OsmRelation, type OsmWay } from './osm-data'

export type WaysInRelation = Record<number, boolean>

export interface ParsedOsmData {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  relations: { [relationId: number]: OsmRelation }

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  ways: { [wayId: number]: OsmWay }

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  nodes: { [nodeId: number]: OsmNode }

  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  nodeCoords: { [nodeId: number]: [number, number] }

  waysInRelation: WaysInRelation
}
