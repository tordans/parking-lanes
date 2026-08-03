import { describe, expect, test } from 'bun:test'
import { buildRoadSpaceSegment } from '@osm-editor-kit/osm-lane-diagram'
import { laneDiagramFixtures } from '@osm-editor-kit/osm-lane-diagram/fixtures'
import { mirrorTags, normalizeTagsForDirection, type Segment } from '@osm-editor-kit/osm-way-chain'
import { orientNeighborForCenter } from '../modes/lanes/domain/orient-neighbor-tags'
import { preferCloserBearing } from '../modes/lanes/use-lanes-fly-to-way'

function swapAllLeftRight(tags: Record<string, string>): Record<string, string> {
  return mirrorTags(tags)
}

function segment(partial: {
  id: number
  nodeIds: number[]
  tags: Record<string, string>
  reversed?: boolean
}): Segment {
  const coords = partial.nodeIds.map((id, i) => [i, id] as [number, number])
  return {
    id: partial.id,
    version: 1,
    nodeIds: partial.nodeIds,
    tags: partial.tags,
    geometry: { type: 'LineString', coordinates: coords },
    reversed: partial.reversed,
  }
}

describe('reversed neighbour orientation', () => {
  const fixture = laneDiagramFixtures.find((f) => f.id === 'reversed-neighbour')
  if (!fixture) throw new Error('reversed-neighbour fixture missing')

  const current = fixture.segments.find((s) => s.role === 'current')!
  const forwardTags = current.tags

  test('normalizeTagsForDirection undoes a digitisation flip so LTR matches forward', () => {
    // Raw OSM tags as if the neighbour was digitised the opposite way.
    const digitisedOpposite = swapAllLeftRight(forwardTags)
    expect(digitisedOpposite['cycleway:left']).toBe('lane')
    expect(digitisedOpposite['cycleway:right']).toBeUndefined()

    const normalised = normalizeTagsForDirection(digitisedOpposite, true)
    expect(normalised['cycleway:right']).toBe('lane')
    expect(normalised['cycleway:left']).toBeUndefined()

    const forwardSeg = buildRoadSpaceSegment(forwardTags, { wayId: 1, role: 'current' })
    const orientedSeg = buildRoadSpaceSegment(normalised, { wayId: 2, role: 'prev' })

    const carriagewayLabel = (seg: ReturnType<typeof buildRoadSpaceSegment>) =>
      seg.slots
        .filter((s) => s.zone === 'carriageway')
        .map((s) => `${s.kind}:${s.side ?? ''}:${s.direction}`)

    // On-carriageway cycleway:right=lane becomes a cycle slot with direction forward (right edge).
    expect(forwardSeg.slots.map((s) => `${s.kind}:${s.direction}`)).toEqual(
      orientedSeg.slots.map((s) => `${s.kind}:${s.direction}`),
    )
    expect(carriagewayLabel(forwardSeg)).toEqual(carriagewayLabel(orientedSeg))
    const forwardCycle = forwardSeg.slots.find((s) => s.kind === 'cycle')
    const orientedCycle = orientedSeg.slots.find((s) => s.kind === 'cycle')
    expect(forwardCycle?.direction).toBe('forward')
    expect(orientedCycle?.direction).toBe('forward')
    expect(forwardCycle?.side).toBe('right')
    expect(orientedCycle?.side).toBe('right')
  })

  test('un-normalised reversed tags would mirror the cycle lane to the left', () => {
    const digitisedOpposite = swapAllLeftRight(forwardTags)
    const mirrored = buildRoadSpaceSegment(digitisedOpposite, { wayId: 3, role: 'prev' })
    const cycle = mirrored.slots.find((s) => s.kind === 'cycle')
    // cycleway:left=lane → direction backward (left of LTR stack)
    expect(cycle?.direction).toBe('backward')
    expect(cycle?.side).toBe('left')
  })
})

describe('orientNeighborForCenter', () => {
  test('orients a reversed neighbour that shares the centre end node', () => {
    const center = segment({
      id: 1,
      nodeIds: [10, 20],
      tags: { highway: 'residential', 'cycleway:right': 'lane' },
      reversed: false,
    })
    // Neighbour digitised into the shared node 20 from both ends → reverse to continue.
    const neighbor = segment({
      id: 2,
      nodeIds: [30, 20],
      tags: { highway: 'residential', 'cycleway:left': 'lane' },
      reversed: false,
    })

    const oriented = orientNeighborForCenter(center, neighbor)
    expect(oriented.reversed).toBe(true)
    // After orienting into centre direction, left/right swap so cycle stays on screen-right.
    expect(oriented.tags['cycleway:right']).toBe('lane')
    expect(oriented.tags['cycleway:left']).toBeUndefined()
  })

  test('falls back to normalizeTagsForDirection when ways do not share a node', () => {
    const center = segment({
      id: 1,
      nodeIds: [1, 2],
      tags: { highway: 'residential' },
      reversed: false,
    })
    const neighbor = segment({
      id: 2,
      nodeIds: [9, 8],
      tags: { highway: 'residential', 'sidewalk:left': 'yes' },
      reversed: true,
    })

    const oriented = orientNeighborForCenter(center, neighbor)
    expect(oriented.tags['sidewalk:right']).toBe('yes')
    expect(oriented.tags['sidewalk:left']).toBeUndefined()
  })
})

describe('preferCloserBearing', () => {
  test('keeps the nearer of target and target+180', () => {
    expect(preferCloserBearing(10, 5)).toBeCloseTo(10, 5)
    expect(preferCloserBearing(10, 170)).toBeCloseTo(190, 5)
  })
})
