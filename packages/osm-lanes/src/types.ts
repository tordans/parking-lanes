/**
 * Lane slot ordering follows OSM pipe convention: left-to-right in the direction
 * of travel for the given `direction` tag (`forward`, `backward`, or `both_ways`).
 * UI cross-sections should reverse backward pipes for display on right-hand roads.
 */
export type Provenance = 'tagged' | 'inferred' | 'default'

export type LaneDirection = 'forward' | 'backward' | 'both_ways'

export type LaneKind = 'travel' | 'bus' | 'bicycle' | 'both_ways_turn'

export type LaneSlotProvenance = {
  count: Provenance
  turn: Provenance
  vehicleAccess: Provenance
  bicycleAccess: Provenance
  busAccess: Provenance
  psvAccess: Provenance
  widthMeters: Provenance
  kind: Provenance
}

export type LaneSlot = {
  /** 0..n-1 within this slot's `direction`, OSM pipe order (LTR along travel). */
  index: number
  direction: LaneDirection
  kind: LaneKind
  turn?: string
  vehicleAccess?: string
  bicycleAccess?: string
  busAccess?: string
  psvAccess?: string
  widthMeters?: number
  provenance: LaneSlotProvenance
}

export type LaneWarning = {
  code: string
  message: string
  severity: 'error' | 'warning'
}

export type WayLaneModel = {
  slots: LaneSlot[]
  laneMarkings?: 'yes' | 'no'
  oneway?: string
  placement?: string
  placementForward?: string
  placementBackward?: string
  lanesTotal?: number
  lanesForward?: number
  lanesBackward?: number
  lanesBothWays?: number
  /** Parsed secondary tags for display chips; not written by serialize. */
  secondary?: {
    destinationLanes?: Record<string, string>
    changeLanes?: Record<string, string>
    maxspeedLanes?: Record<string, string>
    cyclewayLanes?: Record<string, string>
  }
  warnings: LaneWarning[]
}

export const LANE_DIRECTIONS: LaneDirection[] = ['forward', 'backward', 'both_ways']
