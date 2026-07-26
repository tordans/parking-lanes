import type { Segment } from '../domain/types'

export type OsmDataAdapter = {
  getWay: (wayId: number) => Promise<Segment>
  getWaysForNode: (nodeId: number) => Promise<Segment[]>
}
