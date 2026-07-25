import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import {
  buildChangesetComment,
  changeSourceLabels,
  diffWayTags,
  orderedChangeSources,
  orderedModeLabels,
  wayDisplayName,
} from '../utils/changeset-message'

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

describe('changeset-message', () => {
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

  test('orderedModeLabels sorts known modes and skips split', () => {
    expect(orderedModeLabels(['width', 'split', 'parking'])).toEqual(['parking', 'width'])
  })

  test('buildChangesetComment lists modes and longest road names', () => {
    const ways = [
      way(1, { name: 'A' }),
      way(2, { name: 'Langer Weg Name' }),
      way(3, { name: 'Mitte' }),
      way(4, { name: 'Extra Road' }),
    ]
    expect(buildChangesetComment(ways, ['parking', 'width'])).toBe(
      'Update street space parking, width for ways Langer Weg Name, Extra Road, Mitte and other',
    )
  })

  test('buildChangesetComment omits and other when all named roads fit', () => {
    const ways = [way(1, { name: 'Alpha' }), way(2, { name: 'Beta' })]
    expect(buildChangesetComment(ways, ['parking'])).toBe(
      'Update street space parking for ways Alpha, Beta',
    )
  })

  test('buildChangesetComment falls back when roads are unnamed', () => {
    expect(buildChangesetComment([way(9, { highway: 'residential' })], ['width'])).toBe(
      'Update street space width for 1 way',
    )
  })

  test('changeSourceLabels includes ordered modes and split', () => {
    expect(changeSourceLabels(['width', 'split', 'parking'])).toEqual(['parking', 'width', 'split'])
  })

  test('orderedChangeSources keeps mode order then split', () => {
    expect(orderedChangeSources(['width', 'split', 'parking'])).toEqual([
      'parking',
      'width',
      'split',
    ])
  })
})
