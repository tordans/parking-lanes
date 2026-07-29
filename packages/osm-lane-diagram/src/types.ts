export type RoadSpaceSlotKind = 'motor' | 'bus' | 'cycle' | 'both_ways' | 'sidewalk' | 'shared_path'

/** Carriageway = inside kerbs; sidepath = sidewalk / track / shared path outside kerbs. */
export type RoadSpaceZone = 'carriageway' | 'sidepath'

export type RoadSpaceDirection = 'forward' | 'backward' | 'both_ways' | 'none'

export type RoadSpaceProvenance = 'tagged' | 'default' | 'inferred'

export type RoadSpaceSlot = {
  id: string
  kind: RoadSpaceSlotKind
  zone: RoadSpaceZone
  direction: RoadSpaceDirection
  widthM: number
  widthProvenance: RoadSpaceProvenance
  turn?: string
  access?: { vehicle?: string; bicycle?: string; bus?: string }
  segregated?: boolean
  label?: string
}

export type RoadSpaceSegmentRole = 'prev' | 'current' | 'next'

/** Hint that a sidepath exists as its own OSM way — not a slot on this cross-section. */
export type SeparatelyMappedSidepath = {
  prefix: 'sidewalk' | 'cycleway'
  side: 'left' | 'right'
}

export type RoadSpaceSegment = {
  wayId: number
  role: RoadSpaceSegmentRole
  slots: RoadSpaceSlot[]
  /** Distance from left edge of the LTR stack (incl. placeholder/gap) to the OSM centreline. */
  centrelineOffsetM: number
  /** False when `lane_markings=no`. */
  laneMarkings: boolean
  /** Sidepaths tagged `separate` — text hint only, no geometry / metres. */
  separatelyMapped?: SeparatelyMappedSidepath[]
  fork?: {
    gapM: number
    leftSlotIds: string[]
    rightSlotIds: string[]
    dimmedSide?: 'left' | 'right'
    /** Sibling carriageway footprint when that side has no real slots (oneway dual). */
    placeholderWidthM?: number
  }
}

export type RoadSpaceChain = {
  /** Ordered top → bottom as given by the caller. */
  segments: RoadSpaceSegment[]
}

/** Scene rect kinds: travel slots plus non-travel `median` (dual-carriageway gap). */
export type SceneSlotRectKind = RoadSpaceSlotKind | 'median'

export type SceneSlotRect = {
  slotId: string
  wayId: number
  role: RoadSpaceSegmentRole
  kind: SceneSlotRectKind
  zone: RoadSpaceZone
  direction: RoadSpaceDirection
  x: number
  y: number
  width: number
  height: number
  widthProvenance: RoadSpaceProvenance
  label?: string
  turn?: string
  dimmed?: boolean
}

export type ScenePolyline = {
  id: string
  kind: 'kerb' | 'outer_edge' | 'separator' | 'centreline' | 'segment_boundary'
  style: 'solid' | 'dashed'
  points: Array<{ x: number; y: number }>
}

export type SceneSegmentBand = {
  wayId: number
  role: RoadSpaceSegmentRole
  y: number
  height: number
  dimmed: boolean
  label?: string
}

export type RoadSpaceScene = {
  widthPx: number
  heightPx: number
  metersToPx: number
  bands: SceneSegmentBand[]
  slotRects: SceneSlotRect[]
  polylines: ScenePolyline[]
  /** Union of segment `separatelyMapped` hints (text only; no geometry). */
  separatelyMapped?: SeparatelyMappedSidepath[]
}
