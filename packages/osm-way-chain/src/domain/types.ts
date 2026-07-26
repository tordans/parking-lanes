import type { LineString } from 'geojson'

export type OsmTags = Record<string, string>

export type Segment = {
  id: number
  version: number
  nodeIds: number[]
  tags: OsmTags
  geometry: LineString
  /** True when geometry direction was flipped relative to chain traversal */
  reversed?: boolean
}

export type SegmentChain = {
  /** Ordered segments: predecessors (left), center, successors (right) */
  segments: Segment[]
  /** Index of the reference/center segment */
  centerIndex: number
}

export type JunctionChoice = {
  nodeId: number
  direction: 'backward' | 'forward'
  candidates: Segment[]
}

export type NeighborDirection = 'backward' | 'forward'
