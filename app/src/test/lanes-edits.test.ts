import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import {
  addLaneSlot,
  parseWayLanes,
  removeLaneSlot,
  serializeWayLanes,
} from '@osm-editor-kit/osm-lanes'
import { commitLaneModelToWay } from '../modes/lanes/domain/lanes-edits'

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
})
