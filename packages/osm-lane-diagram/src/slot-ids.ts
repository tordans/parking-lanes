import type { LaneDirection } from '@osm-editor-kit/osm-lanes'
import {
  formatSidepathFeatureId,
  parseSidepathFeatureId,
  type SidepathRef,
} from '@osm-editor-kit/osm-sidepath-tags'

export type ParsedLaneSlotId = {
  kind: 'lane'
  wayId: number
  direction: LaneDirection
  index: number
}

export type ParsedEdgeSlotId = {
  kind: 'edge'
  ref: SidepathRef
}

export type ParsedSlotId = ParsedLaneSlotId | ParsedEdgeSlotId

export function formatLaneSlotId(wayId: number, direction: LaneDirection, index: number): string {
  return `way/${wayId}/lane/${direction}/${index}`
}

export function formatEdgeSlotId(ref: SidepathRef): string {
  return formatSidepathFeatureId(ref)
}

export function parseSlotId(id: string): ParsedSlotId | null {
  const edge = parseSidepathFeatureId(id)
  if (edge) return { kind: 'edge', ref: edge }

  const parts = id.split('/')
  if (parts.length !== 5) return null
  if (parts[0] !== 'way') return null
  if (parts[2] !== 'lane') return null

  const wayId = Number.parseInt(parts[1]!, 10)
  if (!Number.isInteger(wayId) || wayId <= 0) return null

  const direction = parts[3]
  if (direction !== 'forward' && direction !== 'backward' && direction !== 'both_ways') {
    return null
  }

  const index = Number.parseInt(parts[4]!, 10)
  if (!Number.isInteger(index) || index < 0) return null

  return { kind: 'lane', wayId, direction, index }
}
