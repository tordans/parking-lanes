import { describe, expect, test } from 'bun:test'
import { DEFAULT_MEDIAN_GAP_M, DEFAULT_METERS_TO_PX, SEGMENT_BAND_HEIGHT_PX } from '../defaults'
import { laneDiagramFixtures } from '../fixtures'
import {
  buildRoadSpaceSegment,
  centrelineOffsetM,
  createsOnWaySidepathSlot,
  DEFAULT_WIDTHS_M,
  formatEdgeSlotId,
  formatLaneSlotId,
  layoutRoadSpace,
  parsePlacement,
  parseSlotId,
  resolvePlacement,
  sceneToSvg,
  type RoadSpaceChain,
  type RoadSpaceSlot,
} from '../index'

function fixtureChain(id: string): RoadSpaceChain {
  const fixture = laneDiagramFixtures.find((f) => f.id === id)
  if (!fixture) throw new Error(`missing fixture ${id}`)
  return {
    segments: fixture.segments.map((seg) =>
      buildRoadSpaceSegment(seg.tags, { wayId: seg.wayId, role: seg.role }),
    ),
  }
}

function motorSlot(id: string, widthM = 3): RoadSpaceSlot {
  return {
    id,
    kind: 'motor',
    zone: 'carriageway',
    direction: 'forward',
    widthM,
    widthProvenance: 'default',
  }
}

describe('placement', () => {
  test('SRK defaults: odd → middle_of:ceil(n/2), even → left_of:(n/2+1)', () => {
    expect(resolvePlacement({}, 3)).toEqual({ kind: 'middle_of', lane: 2 })
    expect(resolvePlacement({}, 4)).toEqual({ kind: 'left_of', lane: 3 })
    expect(resolvePlacement({}, 1)).toEqual({ kind: 'middle_of', lane: 1 })
    expect(resolvePlacement({}, 2)).toEqual({ kind: 'left_of', lane: 2 })
  })

  test('parses left_of / right_of / middle_of / transition', () => {
    expect(parsePlacement('left_of:2')).toEqual({ kind: 'left_of', lane: 2 })
    expect(parsePlacement('right_of:1')).toEqual({ kind: 'right_of', lane: 1 })
    expect(parsePlacement('middle_of:3')).toEqual({ kind: 'middle_of', lane: 3 })
    expect(parsePlacement('transition')).toEqual({ kind: 'transition' })
    expect(parsePlacement('nope')).toBeNull()
  })

  test('transition falls back to default anchor via resolvePlacement', () => {
    expect(resolvePlacement({ placement: 'transition' }, 4)).toEqual({
      kind: 'left_of',
      lane: 3,
    })
  })

  test('centrelineOffsetM maths', () => {
    const slots: RoadSpaceSlot[] = [motorSlot('a'), motorSlot('b'), motorSlot('c'), motorSlot('d')]
    expect(centrelineOffsetM(slots, { kind: 'left_of', lane: 3 })).toBe(6)
    expect(centrelineOffsetM(slots, { kind: 'right_of', lane: 1 })).toBe(3)
    expect(centrelineOffsetM(slots, { kind: 'middle_of', lane: 2 })).toBe(4.5)
    expect(centrelineOffsetM(slots, { kind: 'transition' })).toBe(6)
  })
})

describe('from-tags', () => {
  test('cycle lane expansion counts; bus in lanes=*, cycle not', () => {
    const withBus = buildRoadSpaceSegment(
      {
        highway: 'residential',
        oneway: 'yes',
        lanes: '3',
        'bus:lanes': '||designated',
      },
      { wayId: 1, role: 'current' },
    )
    const motorOrBus = withBus.slots.filter((s) => s.kind === 'motor' || s.kind === 'bus')
    expect(motorOrBus).toHaveLength(3)
    expect(withBus.slots.some((s) => s.kind === 'bus')).toBe(true)

    const withCycle = buildRoadSpaceSegment(
      {
        highway: 'residential',
        oneway: 'yes',
        lanes: '1',
        'cycleway:right': 'lane',
      },
      { wayId: 2, role: 'current' },
    )
    expect(withCycle.slots.filter((s) => s.kind === 'motor')).toHaveLength(1)
    expect(withCycle.slots.filter((s) => s.kind === 'cycle')).toHaveLength(1)
    expect(withCycle.slots.find((s) => s.kind === 'cycle')?.zone).toBe('carriageway')
  })

  test('no sidewalk invented when untagged', () => {
    const seg = buildRoadSpaceSegment(
      { highway: 'residential', lanes: '2' },
      { wayId: 14, role: 'current' },
    )
    expect(seg.slots.every((s) => s.kind !== 'sidewalk' && s.kind !== 'shared_path')).toBe(true)
  })

  test('sidewalks are sidepath zone; motors are carriageway', () => {
    const seg = buildRoadSpaceSegment(
      { highway: 'residential', lanes: '2', sidewalk: 'both' },
      { wayId: 15, role: 'current' },
    )
    expect(seg.slots.filter((s) => s.kind === 'sidewalk').every((s) => s.zone === 'sidepath')).toBe(
      true,
    )
    expect(seg.slots.filter((s) => s.kind === 'motor').every((s) => s.zone === 'carriageway')).toBe(
      true,
    )
  })

  test('edge cycle track is sidepath; on-carriageway lane is carriageway', () => {
    const track = buildRoadSpaceSegment(
      {
        highway: 'residential',
        lanes: '2',
        'cycleway:right': 'track',
      },
      { wayId: 16, role: 'current' },
    )
    expect(track.slots.find((s) => s.kind === 'cycle')?.zone).toBe('sidepath')

    const lane = buildRoadSpaceSegment(
      {
        highway: 'residential',
        oneway: 'yes',
        lanes: '1',
        'cycleway:right': 'lane',
      },
      { wayId: 17, role: 'current' },
    )
    expect(lane.slots.find((s) => s.kind === 'cycle')?.zone).toBe('carriageway')
  })

  test('segregated shared_path handling', () => {
    const yes = buildRoadSpaceSegment(
      {
        highway: 'residential',
        lanes: '2',
        sidewalk: 'right',
        'cycleway:right': 'track',
        segregated: 'yes',
      },
      { wayId: 11, role: 'current' },
    )
    const sharedYes = yes.slots.filter((s) => s.kind === 'shared_path')
    expect(sharedYes).toHaveLength(1)
    expect(sharedYes[0]?.segregated).toBe(true)
    expect(sharedYes[0]?.zone).toBe('sidepath')

    const no = buildRoadSpaceSegment(
      {
        highway: 'residential',
        lanes: '2',
        sidewalk: 'right',
        'cycleway:right': 'track',
        segregated: 'no',
      },
      { wayId: 12, role: 'current' },
    )
    const sharedNo = no.slots.filter((s) => s.kind === 'shared_path')
    expect(sharedNo).toHaveLength(1)
    expect(sharedNo[0]?.segregated).toBe(false)
  })

  test('width provenance tagged vs default', () => {
    const tagged = buildRoadSpaceSegment(
      {
        highway: 'residential',
        oneway: 'yes',
        lanes: '2',
        'width:lanes': '3.2|2.8',
      },
      { wayId: 3, role: 'current' },
    )
    expect(tagged.slots.every((s) => s.widthProvenance === 'tagged')).toBe(true)

    const def = buildRoadSpaceSegment(
      { highway: 'residential', oneway: 'yes', lanes: '2' },
      { wayId: 4, role: 'current' },
    )
    expect(def.slots.every((s) => s.widthProvenance === 'default')).toBe(true)
    expect(def.slots[0]?.widthM).toBe(DEFAULT_WIDTHS_M.motor)
  })

  test('createsOnWaySidepathSlot rejects absent / separately-mapped values', () => {
    expect(createsOnWaySidepathSlot('no')).toBe(false)
    expect(createsOnWaySidepathSlot('none')).toBe(false)
    expect(createsOnWaySidepathSlot('separate')).toBe(false)
    expect(createsOnWaySidepathSlot('use_sidepath')).toBe(false)
    expect(createsOnWaySidepathSlot('yes')).toBe(true)
    expect(createsOnWaySidepathSlot('both')).toBe(true)
    expect(createsOnWaySidepathSlot('track')).toBe(true)
    expect(createsOnWaySidepathSlot('lane')).toBe(true)
    expect(createsOnWaySidepathSlot('shared_lane')).toBe(true)
  })

  test('no / none / separate produce no sidepath slots; separate fills separatelyMapped', () => {
    const no = buildRoadSpaceSegment(
      { highway: 'residential', lanes: '2', sidewalk: 'no' },
      { wayId: 20, role: 'current' },
    )
    expect(no.slots.filter((s) => s.zone === 'sidepath')).toHaveLength(0)
    expect(no.separatelyMapped).toBeUndefined()

    const none = buildRoadSpaceSegment(
      {
        highway: 'residential',
        lanes: '2',
        'sidewalk:left': 'none',
        'sidewalk:right': 'none',
      },
      { wayId: 21, role: 'current' },
    )
    expect(none.slots.filter((s) => s.zone === 'sidepath')).toHaveLength(0)
    expect(none.separatelyMapped).toBeUndefined()

    const separate = buildRoadSpaceSegment(
      {
        highway: 'residential',
        lanes: '2',
        'sidewalk:left': 'no',
        'sidewalk:right': 'separate',
        'cycleway:left': 'no',
        'cycleway:right': 'separate',
      },
      { wayId: 22, role: 'current' },
    )
    expect(separate.slots.filter((s) => s.zone === 'sidepath')).toHaveLength(0)
    expect(separate.slots).toHaveLength(2) // motors only
    expect(separate.separatelyMapped).toEqual([
      { prefix: 'sidewalk', side: 'right' },
      { prefix: 'cycleway', side: 'right' },
    ])
    const scene = layoutRoadSpace({ segments: [separate] })
    expect(scene.separatelyMapped).toEqual(separate.separatelyMapped)

    const yes = buildRoadSpaceSegment(
      { highway: 'residential', lanes: '2', sidewalk: 'both', 'cycleway:right': 'track' },
      { wayId: 23, role: 'current' },
    )
    expect(yes.slots.filter((s) => s.kind === 'sidewalk')).toHaveLength(2)
    expect(yes.slots.filter((s) => s.kind === 'cycle' && s.zone === 'sidepath')).toHaveLength(1)
    expect(yes.separatelyMapped).toBeUndefined()
  })

  test('fixture sidewalk-no-and-separate: no edge slots, separatelyMapped hint', () => {
    const chain = fixtureChain('sidewalk-no-and-separate')
    const seg = chain.segments[0]!
    expect(seg.slots.every((s) => s.zone === 'carriageway')).toBe(true)
    expect(seg.separatelyMapped).toEqual([{ prefix: 'sidewalk', side: 'right' }])
  })

  test('fixture mid-road-cycle-lane: pipe order, 7.5 m carriageway, cycle between motors', () => {
    const chain = fixtureChain('mid-road-cycle-lane')
    const cw = chain.segments[0]!.slots.filter((s) => s.zone === 'carriageway')
    expect(cw.map((s) => `${s.kind}:${s.widthM}`)).toEqual(['motor:3', 'cycle:1.5', 'motor:3'])
    expect(cw.reduce((sum, s) => sum + s.widthM, 0)).toBe(7.5)
    expect(cw[1]?.kind).toBe('cycle')
    expect(cw[0]?.kind).toBe('motor')
    expect(cw[2]?.kind).toBe('motor')
  })

  test('sided cycleway:right=lane stays at carriageway edge', () => {
    const seg = buildRoadSpaceSegment(
      {
        highway: 'residential',
        oneway: 'yes',
        lanes: '1',
        'cycleway:right': 'lane',
        'cycleway:right:width': '1.5',
      },
      { wayId: 30, role: 'current' },
    )
    const cw = seg.slots.filter((s) => s.zone === 'carriageway')
    expect(cw.map((s) => s.kind)).toEqual(['motor', 'cycle'])
  })
})

describe('slot-ids', () => {
  test('format + parseSlotId round-trip', () => {
    const laneId = formatLaneSlotId(42, 'forward', 1)
    expect(laneId).toBe('way/42/lane/forward/1')
    expect(parseSlotId(laneId)).toEqual({
      kind: 'lane',
      wayId: 42,
      direction: 'forward',
      index: 1,
    })

    const edgeId = formatEdgeSlotId({
      osmType: 'way',
      osmId: 7,
      prefix: 'sidewalk',
      side: 'left',
    })
    expect(edgeId).toBe('way/7/sidewalk/left')
    expect(parseSlotId(edgeId)).toEqual({
      kind: 'edge',
      ref: { osmType: 'way', osmId: 7, prefix: 'sidewalk', side: 'left' },
    })
    expect(parseSlotId('garbage')).toBeNull()
  })

  test('ids unique across a segment', () => {
    const seg = buildRoadSpaceSegment(
      {
        highway: 'residential',
        lanes: '2',
        sidewalk: 'both',
        'cycleway:right': 'lane',
      },
      { wayId: 99, role: 'current' },
    )
    const ids = seg.slots.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('layout continuity', () => {
  test('kerbs at carriageway bounds; carriageway clear width sum; continuous equal bands', () => {
    const chain = fixtureChain('one-lane-each-way')
    const scene = layoutRoadSpace(chain)
    expect(scene.bands).toHaveLength(3)

    const leftKerb = scene.polylines.find((p) => p.id === 'kerb-left')!
    const rightKerb = scene.polylines.find((p) => p.id === 'kerb-right')!
    expect(leftKerb).toBeDefined()
    expect(rightKerb).toBeDefined()

    // Equal segments → dead-straight kerbs (only endpoints after dedupe of continuous run)
    for (const p of leftKerb.points) {
      expect(Math.abs(p.x - leftKerb.points[0]!.x)).toBeLessThanOrEqual(0.01)
    }
    for (const p of rightKerb.points) {
      expect(Math.abs(p.x - rightKerb.points[0]!.x)).toBeLessThanOrEqual(0.01)
    }
    // Continuous run: no intermediate horizontal points — just top + bottom for equal bands
    expect(leftKerb.points.length).toBe(2)
    expect(rightKerb.points.length).toBe(2)

    // Outer edges exist when sidewalks present and differ from kerbs
    const outerLeft = scene.polylines.filter(
      (p) => p.kind === 'outer_edge' && p.id.includes('left'),
    )
    const outerRight = scene.polylines.filter(
      (p) => p.kind === 'outer_edge' && p.id.includes('right'),
    )
    expect(outerLeft.length).toBeGreaterThanOrEqual(1)
    expect(outerRight.length).toBeGreaterThanOrEqual(1)
    expect(Math.abs(outerLeft[0]!.points[0]!.x - leftKerb.points[0]!.x)).toBeGreaterThan(0.01)

    // Carriageway clear-width sum equals kerb-to-kerb
    for (const seg of chain.segments) {
      const cwSum = seg.slots
        .filter((s) => s.zone === 'carriageway')
        .reduce((s, slot) => s + slot.widthM, 0)
      expect(cwSum).toBeGreaterThan(0)
      expect(seg.slots.every((s) => s.widthM > 0)).toBe(true)

      const kerbToKerbM = (rightKerb.points[0]!.x - leftKerb.points[0]!.x) / scene.metersToPx
      expect(Math.abs(kerbToKerbM - cwSum)).toBeLessThan(0.05)

      const rects = scene.slotRects.filter(
        (r) =>
          r.wayId === seg.wayId && r.zone === 'carriageway' && !r.slotId.includes('placeholder'),
      )
      const rectSum = rects.reduce((s, r) => s + r.width / scene.metersToPx, 0)
      expect(Math.abs(rectSum - cwSum)).toBeLessThan(0.05)
    }

    // Segment boundaries present between bands; no per-band horizontal kerb boxes
    const boundaries = scene.polylines.filter((p) => p.kind === 'segment_boundary')
    expect(boundaries).toHaveLength(2)
    expect(boundaries.every((b) => b.style === 'dashed')).toBe(true)

    // Contiguous bands (zero gap)
    for (let i = 0; i < scene.bands.length - 1; i++) {
      const a = scene.bands[i]!
      const b = scene.bands[i + 1]!
      expect(Math.abs(a.y + a.height - b.y)).toBeLessThanOrEqual(0.01)
    }
  })

  test('fixture 3: right-side pocket tapers right; left edge stays straight', () => {
    const scene = layoutRoadSpace(fixtureChain('right-turn-pocket'))
    const left = scene.polylines.find((p) => p.id === 'kerb-left')!
    const right = scene.polylines.find((p) => p.id === 'kerb-right')!

    const leftXs = [...new Set(left.points.map((p) => p.x))]
    expect(leftXs).toHaveLength(1)

    const rightXs = [...new Set(right.points.map((p) => p.x))]
    expect(rightXs.length).toBeGreaterThan(1)
    expect(Math.max(...rightXs)).toBeGreaterThan(Math.min(...rightXs))
  })

  test('fixture 4: taper when pocket ends (left stays straight for oneway drop on right)', () => {
    const scene = layoutRoadSpace(fixtureChain('turn-pocket-then-continue'))
    const left = scene.polylines.find((p) => p.id === 'kerb-left')!
    const right = scene.polylines.find((p) => p.id === 'kerb-right')!
    const leftXs = [...new Set(left.points.map((p) => p.x))]
    expect(leftXs).toHaveLength(1)
    const rightXs = [...new Set(right.points.map((p) => p.x))]
    expect(rightXs.length).toBeGreaterThan(1)
  })

  test('fixture 5: dual median gap + placeholder inside scene', () => {
    const chain = fixtureChain('dual-carriageway-island')
    const dual = chain.segments.find((s) => s.role === 'current')!
    expect(dual.fork).toBeDefined()
    expect(dual.fork!.gapM).toBe(DEFAULT_MEDIAN_GAP_M)
    expect(dual.fork!.dimmedSide).toBe('left')
    expect(dual.fork!.placeholderWidthM).toBeGreaterThan(0)

    const scene = layoutRoadSpace(chain)
    const placeholder = scene.slotRects.find(
      (r) => r.wayId === dual.wayId && r.slotId.endsWith('/fork/placeholder'),
    )
    expect(placeholder).toBeDefined()
    expect(placeholder!.dimmed).toBe(true)
    expect(placeholder!.label).toBe('sibling')

    const median = scene.slotRects.find(
      (r) => r.wayId === dual.wayId && r.kind === 'median' && r.role === 'current',
    )
    expect(median).toBeDefined()
    expect(median!.zone).toBe('carriageway')
    expect(median!.direction).toBe('none')
    expect(Math.abs(median!.width - DEFAULT_MEDIAN_GAP_M * scene.metersToPx)).toBeLessThanOrEqual(
      0.01,
    )

    const realCw = scene.slotRects.filter(
      (r) =>
        r.wayId === dual.wayId &&
        r.zone === 'carriageway' &&
        r.kind !== 'median' &&
        !r.slotId.includes('placeholder') &&
        r.role === 'current',
    )
    expect(realCw.length).toBeGreaterThanOrEqual(1)
    const cwLeft = Math.min(...realCw.map((r) => r.x))
    expect(Math.abs(cwLeft - (median!.x + median!.width))).toBeLessThanOrEqual(0.01)
    const gapPx = cwLeft - (placeholder!.x + placeholder!.width)
    expect(Math.abs(gapPx - DEFAULT_MEDIAN_GAP_M * scene.metersToPx)).toBeLessThanOrEqual(0.01)

    // No fork_edge polylines
    expect(scene.polylines.every((p) => p.kind !== ('fork_edge' as never))).toBe(true)
  })

  test('dual chain: placeholder+median only on dual bands; no polyline crosses median', () => {
    const chain = fixtureChain('dual-carriageway-island')
    // [non-dual prev, dual current, dual next]
    expect(chain.segments.map((s) => s.fork != null)).toEqual([false, true, true])

    const scene = layoutRoadSpace(chain)
    const placeholders = scene.slotRects.filter((r) => r.slotId.endsWith('/fork/placeholder'))
    const medians = scene.slotRects.filter((r) => r.kind === 'median')
    expect(placeholders).toHaveLength(2)
    expect(medians).toHaveLength(2)
    expect(placeholders.every((p) => p.label === 'sibling')).toBe(true)
    expect(placeholders.every((p) => p.role === 'current' || p.role === 'next')).toBe(true)
    expect(scene.slotRects.some((r) => r.role === 'prev' && r.slotId.includes('fork'))).toBe(false)

    for (const median of medians) {
      const mLeft = median.x
      const mRight = median.x + median.width
      const mTop = median.y
      const mBot = median.y + median.height
      for (const line of scene.polylines) {
        if (line.kind === 'segment_boundary') continue
        for (let i = 0; i < line.points.length - 1; i++) {
          const a = line.points[i]!
          const b = line.points[i + 1]!
          const dy = Math.abs(a.y - b.y)
          const dx = Math.abs(a.x - b.x)
          // Only care about diagonals / horizontals that cut through the island
          // interior — vertical median faces are expected.
          if (dx <= 0.01) continue
          const midY = (a.y + b.y) / 2
          if (midY <= mTop + 0.01 || midY >= mBot - 0.01) continue
          const crosses =
            (a.x < mLeft - 0.01 && b.x > mRight + 0.01) ||
            (b.x < mLeft - 0.01 && a.x > mRight + 0.01) ||
            (midY > mTop + 0.01 &&
              midY < mBot - 0.01 &&
              ((a.x > mLeft + 0.01 && a.x < mRight - 0.01) ||
                (b.x > mLeft + 0.01 && b.x < mRight - 0.01)))
          expect({ id: line.id, a, b, crosses, dy }).toEqual(
            expect.objectContaining({ crosses: false }),
          )
        }
      }
    }
  })

  test('natural scene size fits a ~360px column at DEFAULT_METERS_TO_PX', () => {
    expect(DEFAULT_METERS_TO_PX).toBe(20)
    expect(SEGMENT_BAND_HEIGHT_PX).toBe(96)
    const scene = layoutRoadSpace(fixtureChain('two-lane-each-way'))
    expect(scene.widthPx).toBe(352)
    expect(scene.heightPx).toBe(320)
    // Typical 14 m clear width → 280 px + padding stays under ~360
    expect(14 * DEFAULT_METERS_TO_PX + 32).toBeLessThanOrEqual(360)
  })

  test('every fixture lays out inside the scene box', () => {
    for (const fixture of laneDiagramFixtures) {
      const scene = layoutRoadSpace(fixtureChain(fixture.id))
      for (const rect of scene.slotRects) {
        expect(rect.x).toBeGreaterThanOrEqual(-0.01)
        expect(rect.y).toBeGreaterThanOrEqual(-0.01)
        expect(rect.x + rect.width).toBeLessThanOrEqual(scene.widthPx + 0.01)
        expect(rect.y + rect.height).toBeLessThanOrEqual(scene.heightPx + 0.01)
      }
      for (const line of scene.polylines) {
        for (const p of line.points) {
          expect(p.x).toBeGreaterThanOrEqual(-0.01)
          expect(p.y).toBeGreaterThanOrEqual(-0.01)
          expect(p.x).toBeLessThanOrEqual(scene.widthPx + 0.01)
          expect(p.y).toBeLessThanOrEqual(scene.heightPx + 0.01)
        }
      }
    }
  })
})

describe('sceneToSvg snapshots', () => {
  for (const fixture of laneDiagramFixtures) {
    test(`deterministic SVG for ${fixture.id}`, () => {
      const scene = layoutRoadSpace(fixtureChain(fixture.id))
      const svg = sceneToSvg(scene)
      const svg2 = sceneToSvg(scene)
      expect(svg).toBe(svg2)
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
      expect(svg).toContain('</svg>')
      expect(svg).toMatchSnapshot()
    })
  }
})

describe('all fixtures', () => {
  test('every fixture lays out without throwing and has ≥1 slot rect per segment', () => {
    expect(laneDiagramFixtures).toHaveLength(19)
    for (const fixture of laneDiagramFixtures) {
      const chain = fixtureChain(fixture.id)
      const scene = layoutRoadSpace(chain)
      expect(scene.bands.length).toBe(fixture.segments.length)
      for (const seg of chain.segments) {
        const rects = scene.slotRects.filter((r) => r.wayId === seg.wayId)
        expect(rects.length).toBeGreaterThanOrEqual(1)
      }
      expect(() => sceneToSvg(scene)).not.toThrow()
    }
  })
})
