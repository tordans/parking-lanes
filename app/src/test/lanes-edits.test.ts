import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import {
  addLaneSlot,
  parseWayLanes,
  removeLaneSlot,
  serializeWayLanes,
} from '@osm-editor-kit/osm-lanes'
import { applyOnewayLaneCount, commitLaneModelToWay } from '../modes/lanes/domain/lanes-edits'

function way(id: number, tags: Record<string, string>): OsmWay {
  return { id, nodes: [1, 2], tags }
}

describe('lanes-edits commit path', () => {
  test('add lane updates way tags through serialize', () => {
    const base = way(42, {
      highway: 'secondary',
      lanes: '2',
      'lanes:forward': '1',
      'lanes:backward': '1',
      'turn:lanes:forward': 'left',
      'turn:lanes:backward': 'through',
    })
    const model = addLaneSlot(parseWayLanes(base.tags), 'backward')
    const updated = commitLaneModelToWay(base, model)

    expect(updated.tags['lanes:backward']).toBe('2')
    expect(updated.tags.lanes).toBe('3')
    expect(updated.tags['turn:lanes:backward']).toBe('through|through')
  })

  test('remove lane updates way tags through serialize', () => {
    const base = way(7, {
      highway: 'primary',
      oneway: 'yes',
      lanes: '2',
      'turn:lanes': 'left|through',
    })
    const model = removeLaneSlot(parseWayLanes(base.tags), 'forward', 1)
    expect(model).not.toBeNull()

    const updated = commitLaneModelToWay(base, model!)
    expect(updated.tags.lanes).toBe('1')
    expect(updated.tags['turn:lanes']).toBe('left')
    expect(serializeWayLanes(model!, base.tags)).toEqual(updated.tags)
  })

  test('applyOnewayLaneCount syncs lanesTotal and lanesForward so serialize writes lanes', () => {
    const base = way(9, { highway: 'primary', oneway: 'yes', lanes: '2' })
    const model = parseWayLanes(base.tags)
    expect(model.lanesTotal).toBe(2)
    expect(model.lanesForward).toBe(2)

    // Bug class: only lanesTotal updated (as the form used to do).
    const stale = commitLaneModelToWay(base, { ...model, lanesTotal: 5 })
    expect(stale.tags.lanes).toBe('2')

    // Form path: applyOnewayLaneCount must set both fields.
    const synced = applyOnewayLaneCount(model, 5)
    expect(synced.lanesTotal).toBe(5)
    expect(synced.lanesForward).toBe(5)

    const fixed = commitLaneModelToWay(base, synced)
    expect(fixed.tags.lanes).toBe('5')
    expect(fixed.tags['lanes:forward']).toBeUndefined()
  })

  test('two-way directional lane counts round-trip through commit', () => {
    const base = way(11, {
      highway: 'secondary',
      lanes: '3',
      'lanes:forward': '2',
      'lanes:backward': '1',
    })
    const model = parseWayLanes(base.tags)
    const updated = commitLaneModelToWay(base, {
      ...model,
      lanesTotal: 4,
      lanesForward: 2,
      lanesBackward: 1,
      lanesBothWays: 1,
    })
    expect(updated.tags.lanes).toBe('4')
    expect(updated.tags['lanes:forward']).toBe('2')
    expect(updated.tags['lanes:backward']).toBe('1')
    expect(updated.tags['lanes:both_ways']).toBe('1')

    const again = parseWayLanes(updated.tags)
    expect(again.lanesTotal).toBe(4)
    expect(again.lanesForward).toBe(2)
    expect(again.lanesBackward).toBe(1)
    expect(again.lanesBothWays).toBe(1)
  })

  test('oneway: lanesForward edit reaches tags.lanes', () => {
    const base = way(12, { highway: 'primary', oneway: 'yes', lanes: '2' })
    const model = parseWayLanes(base.tags)
    const updated = commitLaneModelToWay(base, applyOnewayLaneCount(model, 3))
    expect(updated.tags.lanes).toBe('3')
  })
})
