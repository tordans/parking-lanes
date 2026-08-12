import { describe, expect, test } from 'bun:test'
import { parseWayLanes, reconcileWidths, serializeWayLanes } from '../index'

describe('change/surface/smoothness:lanes round-trip', () => {
  test('undirected change:lanes parse → mutate → serialize → parse', () => {
    const tags = {
      highway: 'residential',
      name: 'Change Street',
      lanes: '2',
      'change:lanes': 'not|yes',
      'turn:lanes': 'left|through',
    }
    const model = parseWayLanes(tags)
    expect(model.slots).toHaveLength(2)
    expect(model.slots[0]?.change).toBe('not')
    expect(model.slots[1]?.change).toBe('yes')

    const mutated = {
      ...model,
      slots: model.slots.map((s, i) => (i === 0 ? { ...s, change: 'yes' } : s)),
    }
    const out = serializeWayLanes(mutated, tags)
    expect(out['change:lanes']).toBe('yes|yes')
    expect(out['change:lanes:forward']).toBeUndefined()
    expect(out.name).toBe('Change Street')
    expect(out.highway).toBe('residential')

    const again = parseWayLanes(out)
    expect(again.slots[0]?.change).toBe('yes')
    expect(again.slots[1]?.change).toBe('yes')
  })

  test('directional surface:lanes and smoothness:lanes', () => {
    const tags = {
      highway: 'secondary',
      lanes: '4',
      'lanes:forward': '2',
      'lanes:backward': '2',
      'surface:lanes:forward': 'asphalt|asphalt',
      'surface:lanes:backward': 'asphalt|paving_stones',
      'smoothness:lanes:forward': 'good|intermediate',
      'smoothness:lanes:backward': 'good|bad',
      'turn:lanes:forward': 'left|through',
      'turn:lanes:backward': 'through|right',
    }
    const model = parseWayLanes(tags)
    const forward = model.slots.filter((s) => s.direction === 'forward')
    const backward = model.slots.filter((s) => s.direction === 'backward')
    expect(forward[0]?.surface).toBe('asphalt')
    expect(forward[1]?.smoothness).toBe('intermediate')
    expect(backward[1]?.surface).toBe('paving_stones')
    expect(backward[1]?.smoothness).toBe('bad')

    const mutated = {
      ...model,
      slots: model.slots.map((s) =>
        s.direction === 'backward' && s.index === 1 ? { ...s, surface: 'concrete' } : s,
      ),
    }
    const out = serializeWayLanes(mutated, tags)
    expect(out['surface:lanes:forward']).toBe('asphalt|asphalt')
    expect(out['surface:lanes:backward']).toBe('asphalt|concrete')
    expect(out['smoothness:lanes:forward']).toBe('good|intermediate')
    expect(out['smoothness:lanes:backward']).toBe('good|bad')
    expect(out['surface:lanes']).toBeUndefined()

    const again = parseWayLanes(out)
    const againBackward = again.slots.filter((s) => s.direction === 'backward')
    expect(againBackward[1]?.surface).toBe('concrete')
    expect(againBackward[1]?.smoothness).toBe('bad')
  })

  test('oneway change/surface/smoothness pipes stay undirected', () => {
    const tags = {
      highway: 'primary',
      oneway: 'yes',
      lanes: '2',
      'change:lanes': 'not|yes',
      'surface:lanes': 'asphalt|asphalt',
      'smoothness:lanes': 'excellent|good',
    }
    const model = parseWayLanes(tags)
    expect(model.slots[0]?.change).toBe('not')
    expect(model.slots[1]?.surface).toBe('asphalt')
    expect(model.slots[1]?.smoothness).toBe('good')

    const mutated = {
      ...model,
      slots: model.slots.map((s, i) => (i === 1 ? { ...s, smoothness: 'intermediate' } : s)),
    }
    const out = serializeWayLanes(mutated, tags)
    expect(out['change:lanes']).toBe('not|yes')
    expect(out['surface:lanes']).toBe('asphalt|asphalt')
    expect(out['smoothness:lanes']).toBe('excellent|intermediate')
    expect(out['change:lanes:forward']).toBeUndefined()

    const again = parseWayLanes(out)
    expect(again.slots[1]?.smoothness).toBe('intermediate')
  })

  test('empty pipes are suppressed; unrelated tags survive', () => {
    const tags = {
      highway: 'tertiary',
      maxspeed: '50',
      lanes: '2',
      'turn:lanes': 'through|through',
      'change:lanes': 'yes|yes',
    }
    const model = parseWayLanes(tags)
    const cleared = {
      ...model,
      slots: model.slots.map((s) => ({ ...s, change: undefined })),
    }
    const out = serializeWayLanes(cleared, tags)
    expect(out['change:lanes']).toBeUndefined()
    expect(out.maxspeed).toBe('50')
    expect(out['turn:lanes']).toBe('through|through')
  })
})

describe('reconcileWidths', () => {
  test('width + lanes alone: no warnings, no slotSum, no residual', () => {
    const result = reconcileWidths({
      width: '10',
      lanes: '2',
    })
    expect(result.widthM).toBe(10)
    expect(result.slotSumM).toBeUndefined()
    expect(result.taggedSlotCount).toBe(0)
    expect(result.residualM).toBeUndefined()
    expect(result.paintEstimateM).toBe(0)
    expect(result.warnings).toEqual([])
  })

  test('Scenario A: two lanes, paint explains residual', () => {
    const result = reconcileWidths({
      width: '6.36',
      'width:lanes': '3|3',
      lane_markings: 'yes',
    })
    // Clear slots 3+3=6; paint = (1 separator + 2 edges) × 0.12 = 0.36
    expect(result.widthM).toBe(6.36)
    expect(result.widthSource).toBe('width')
    expect(result.slotSumM).toBe(6)
    expect(result.taggedSlotCount).toBe(2)
    expect(result.parkingM).toBe(0)
    expect(result.bufferM).toBe(0)
    expect(result.paintEstimateM).toBe(0.36)
    expect(result.residualM).toBeCloseTo(0.36, 6)
    expect(result.warnings.some((w) => w.code === 'unexplained_residual')).toBe(false)
    expect(result.warnings.some((w) => w.code === 'sum_exceeds_width')).toBe(false)
  })

  test('Scenario B: parking + bike + buffer parts close to width', () => {
    const result = reconcileWidths({
      width: '8',
      lanes: '1',
      'width:lanes': '3|2',
      'parking:left': 'lane',
      'parking:left:width': '2',
      'cycleway:right': 'lane',
      'cycleway:right:width': '2',
      'cycleway:right:buffer:left': '1',
    })
    // 3+2 slots + parking 2 + buffer 1 = 8; residual 0
    expect(result.widthM).toBe(8)
    expect(result.widthSource).toBe('width')
    expect(result.slotSumM).toBe(5)
    expect(result.taggedSlotCount).toBe(2)
    expect(result.parkingM).toBe(2)
    expect(result.bufferM).toBe(1)
    expect(result.residualM).toBe(0)
    // Paint estimate still computed (lane_markings absent ⇒ not "no"): (1+2)×0.12=0.36
    expect(result.paintEstimateM).toBe(0.36)
    expect(result.warnings.some((w) => w.code === 'sum_exceeds_width')).toBe(false)
    expect(result.warnings.some((w) => w.code === 'unexplained_residual')).toBe(false)
    expect(result.warnings.some((w) => w.code === 'cycleway_width_double_count')).toBe(true)
  })

  test('sum_exceeds_width fires when parts exceed width', () => {
    const result = reconcileWidths({
      width: '5',
      'width:lanes': '3|3',
    })
    expect(result.slotSumM).toBe(6)
    expect(result.warnings.some((w) => w.code === 'sum_exceeds_width')).toBe(true)
  })

  test('pipe_count_mismatch fires when width:lanes length differs', () => {
    const result = reconcileWidths({
      width: '6',
      'width:lanes': '3|3',
      'turn:lanes': 'left|through|right',
    })
    expect(result.warnings.some((w) => w.code === 'pipe_count_mismatch')).toBe(true)
  })

  test('cycleway_width_double_count fires on dual modelling', () => {
    const result = reconcileWidths({
      width: '7',
      lanes: '1',
      'width:lanes': '3|2',
      'bicycle:lanes': 'no|designated',
      'cycleway:right': 'lane',
      'cycleway:right:width': '2',
    })
    expect(result.warnings.some((w) => w.code === 'cycleway_width_double_count')).toBe(true)
  })

  test('prefer_width_when_unmarked when lane_markings=no and no width', () => {
    const result = reconcileWidths({
      lane_markings: 'no',
      lanes: '2',
    })
    expect(result.widthM).toBeUndefined()
    expect(result.slotSumM).toBeUndefined()
    expect(result.paintEstimateM).toBe(0)
    expect(result.warnings.some((w) => w.code === 'prefer_width_when_unmarked')).toBe(true)
  })

  test('est_width fallback sets widthSource', () => {
    const result = reconcileWidths({
      est_width: '7.5',
      'width:lanes': '3.5|3.5',
    })
    expect(result.widthM).toBe(7.5)
    expect(result.widthSource).toBe('est_width')
    expect(result.slotSumM).toBe(7)
    expect(result.taggedSlotCount).toBe(2)
  })

  test('parking=street_side width is excluded from parkingM', () => {
    const result = reconcileWidths({
      width: '6',
      'width:lanes': '3|3',
      'parking:left': 'street_side',
      'parking:left:width': '2.2',
    })
    expect(result.parkingM).toBe(0)
    expect(result.slotSumM).toBe(6)
    expect(result.residualM).toBe(0)
  })

  test('parking:*:width without a position tag does not count', () => {
    const result = reconcileWidths({
      width: '8',
      'width:lanes': '3|2',
      'parking:left:width': '2',
    })
    expect(result.parkingM).toBe(0)
    expect(result.slotSumM).toBe(5)
    expect(result.residualM).toBe(3)
  })

  test('fixture parking-both-sides: lane + half_on_kerb both count', () => {
    const result = reconcileWidths({
      highway: 'residential',
      lanes: '2',
      'lanes:forward': '1',
      'lanes:backward': '1',
      width: '10.4',
      'width:lanes:forward': '3.2',
      'width:lanes:backward': '3.2',
      'parking:left': 'lane',
      'parking:left:orientation': 'parallel',
      'parking:left:width': '2',
      'parking:right': 'half_on_kerb',
      'parking:right:orientation': 'parallel',
      'parking:right:width': '1.8',
      sidewalk: 'both',
    })
    // 3.2+3.2 lanes + 2+1.8 parking = 10.2; residual 0.2
    expect(result.slotSumM).toBeCloseTo(6.4, 6)
    expect(result.parkingM).toBeCloseTo(3.8, 6)
    expect(result.bufferM).toBe(0)
    expect(result.residualM).toBeCloseTo(0.2, 6)
    expect(result.warnings).toEqual([])
  })

  test('fixture parking-street-side-excluded: street_side metres omitted', () => {
    const result = reconcileWidths({
      highway: 'residential',
      lanes: '2',
      width: '6.5',
      'width:lanes': '3.25|3.25',
      'parking:left': 'street_side',
      'parking:left:orientation': 'parallel',
      'parking:left:width': '2.5',
      'parking:right': 'no',
      sidewalk: 'both',
    })
    expect(result.slotSumM).toBeCloseTo(6.5, 6)
    expect(result.parkingM).toBe(0)
    expect(result.bufferM).toBe(0)
    expect(result.residualM).toBe(0)
    expect(result.warnings).toEqual([])
  })

  test('fixture cycle-separation-buffer: nested buffers count; separation ignored', () => {
    const result = reconcileWidths({
      highway: 'residential',
      oneway: 'yes',
      lanes: '1',
      width: '6.5',
      'width:lanes': '3.25|2',
      'cycleway:right': 'lane',
      'cycleway:right:width': '2',
      'cycleway:right:buffer:left': '0.75',
      'cycleway:right:buffer:right': '0.5',
      'cycleway:right:separation:left': 'bollard',
      'cycleway:right:traffic_mode:left': 'motor_vehicle',
      sidewalk: 'right',
    })
    // 3.25+2 lanes + 0.75+0.5 buffers = 6.5; residual 0
    expect(result.slotSumM).toBeCloseTo(5.25, 6)
    expect(result.parkingM).toBe(0)
    expect(result.bufferM).toBeCloseTo(1.25, 6)
    expect(result.residualM).toBe(0)
    expect(result.warnings.some((w) => w.code === 'cycleway_width_double_count')).toBe(true)
    expect(result.warnings.some((w) => w.code === 'sum_exceeds_width')).toBe(false)
  })

  test('lane_markings=no yields zero paint estimate', () => {
    const result = reconcileWidths({
      width: '6',
      'width:lanes': '3|3',
      lane_markings: 'no',
    })
    expect(result.paintEstimateM).toBe(0)
  })
})
