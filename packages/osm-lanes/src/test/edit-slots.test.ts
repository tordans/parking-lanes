import { describe, expect, test } from 'bun:test'
import {
  addLaneSlot,
  removeLaneSlot,
  slotHasRichData,
  syncModelCountsFromSlots,
} from '../edit-slots'
import { parseWayLanes, serializeWayLanes } from '../index'
import type { LaneSlot } from '../types'

describe('addLaneSlot', () => {
  test('adds forward lane on two-way road and updates counts', () => {
    const tags = {
      highway: 'secondary',
      lanes: '2',
      'lanes:forward': '1',
      'lanes:backward': '1',
      'turn:lanes:forward': 'left',
      'turn:lanes:backward': 'through',
    }
    const model = parseWayLanes(tags)
    const next = addLaneSlot(model, 'forward')

    expect(next.slots.filter((s) => s.direction === 'forward')).toHaveLength(2)
    const added = next.slots.find((s) => s.direction === 'forward' && s.index === 1)
    expect(added).toMatchObject({
      turn: 'through',
      vehicleAccess: 'yes',
      bicycleAccess: 'yes',
      provenance: { count: 'tagged', turn: 'tagged' },
    })
    expect(next.lanesForward).toBe(2)
    expect(next.lanesTotal).toBe(3)

    const out = serializeWayLanes(next, tags)
    expect(out['lanes:forward']).toBe('2')
    expect(out.lanes).toBe('3')
    expect(out['turn:lanes:forward']).toBe('left|through')
  })

  test('adds lane on oneway road', () => {
    const tags = {
      highway: 'primary',
      oneway: 'yes',
      lanes: '1',
      'turn:lanes': 'through',
    }
    const model = parseWayLanes(tags)
    const next = addLaneSlot(model, 'forward')

    expect(next.slots).toHaveLength(2)
    expect(next.lanesForward).toBe(2)
    expect(next.lanesTotal).toBe(2)

    const out = serializeWayLanes(next, tags)
    expect(out.lanes).toBe('2')
    expect(out['turn:lanes']).toBe('through|through')
  })
})

describe('removeLaneSlot', () => {
  test('removes selected slot and updates pipe tags', () => {
    const tags = {
      highway: 'secondary',
      lanes: '2',
      'lanes:forward': '2',
      'turn:lanes:forward': 'left|through',
    }
    const model = parseWayLanes(tags)
    const next = removeLaneSlot(model, 'forward', 0)
    expect(next).not.toBeNull()
    expect(next!.slots.filter((s) => s.direction === 'forward')).toHaveLength(1)
    expect(next!.lanesForward).toBe(1)

    const out = serializeWayLanes(next!, tags)
    expect(out['lanes:forward']).toBe('1')
    expect(out['turn:lanes:forward']).toBe('through')
  })
})

describe('slotHasRichData', () => {
  test('detects non-default turn and access', () => {
    const base = defaultSlot()
    expect(slotHasRichData(base)).toBe(false)
    expect(slotHasRichData({ ...base, turn: 'left' })).toBe(true)
    expect(slotHasRichData({ ...base, vehicleAccess: 'no' })).toBe(true)
    expect(slotHasRichData({ ...base, widthMeters: 3 })).toBe(true)
  })
})

describe('syncModelCountsFromSlots', () => {
  test('recomputes totals from slot list', () => {
    const model = parseWayLanes({
      highway: 'residential',
      lanes: '3',
      'lanes:forward': '2',
      'lanes:backward': '1',
    })
    const trimmed = {
      ...model,
      slots: model.slots.filter((s) => !(s.direction === 'forward' && s.index === 1)),
    }
    const synced = syncModelCountsFromSlots(trimmed)
    expect(synced.lanesForward).toBe(1)
    expect(synced.lanesTotal).toBe(2)
  })
})

function defaultSlot(): LaneSlot {
  return {
    index: 0,
    direction: 'forward',
    kind: 'travel',
    turn: 'through',
    vehicleAccess: 'yes',
    bicycleAccess: 'yes',
    provenance: {
      count: 'tagged',
      turn: 'tagged',
      vehicleAccess: 'tagged',
      bicycleAccess: 'tagged',
      busAccess: 'tagged',
      psvAccess: 'tagged',
      widthMeters: 'tagged',
      kind: 'tagged',
    },
  }
}
