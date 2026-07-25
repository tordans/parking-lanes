import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { diffWayTags, wayDisplayName } from '../way-tags'

function way(id: number, tags: Record<string, string>): OsmWay {
  return {
    id,
    type: 'way',
    version: 1,
    changeset: 1,
    nodes: [1, 2],
    tags,
  }
}

describe('way-tags', () => {
  test('wayDisplayName prefers name then ref', () => {
    expect(wayDisplayName(way(1, { name: 'Hauptstraße' }))).toBe('Hauptstraße')
    expect(wayDisplayName(way(2, { ref: 'B96' }))).toBe('B96')
    expect(wayDisplayName(way(3, {}))).toBe('way 3')
  })

  test('diffWayTags reports added, removed, and changed tags', () => {
    const original = way(1, { highway: 'residential', width: '5' })
    const current = way(1, { highway: 'residential', width: '6', 'parking:both': 'lane' })
    expect(diffWayTags(original, current)).toEqual([
      { key: 'parking:both', from: null, to: 'lane' },
      { key: 'width', from: '5', to: '6' },
    ])
  })
})
