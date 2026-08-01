import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { QueryClient } from '@tanstack/react-query'
import {
  applyTableTagToWay,
  osmKeyFromDisplayKey,
  resolveTableEditBaseWay,
} from '../modes/table/domain/table-edits'
import { mergeWayEdit } from '../shell/map/merge-way-edit'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageSessionKey,
} from '../shell/map/osm-coverage-query'
import { commitOsmWayChange, getOsmWayFromSession } from '../shell/map/osm-session-way-edits'
import { clearChanges } from '../utils/changes-store'

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

describe('osmKeyFromDisplayKey', () => {
  test('leaves keys unchanged when not reversed', () => {
    expect(osmKeyFromDisplayKey('cycleway:left:surface', false)).toBe('cycleway:left:surface')
    expect(osmKeyFromDisplayKey('highway', false)).toBe('highway')
  })

  test('swaps left/right when reversed', () => {
    expect(osmKeyFromDisplayKey('cycleway:left:surface', true)).toBe('cycleway:right:surface')
    expect(osmKeyFromDisplayKey('parking:right', true)).toBe('parking:left')
    expect(osmKeyFromDisplayKey('sidewalk:left:width', true)).toBe('sidewalk:right:width')
  })
})

describe('applyTableTagToWay orientation', () => {
  test('reversed neighbor: display *:left:* commits as *:right:* on raw way', () => {
    const base = way(10, {
      highway: 'residential',
      'cycleway:right:surface': 'asphalt',
    })
    const next = applyTableTagToWay(base, 'cycleway:left:surface', 'concrete', true)
    expect(next.tags['cycleway:right:surface']).toBe('concrete')
    expect(next.tags['cycleway:left:surface']).toBeUndefined()
  })

  test('reversed neighbor: display *:right:* commits as *:left:* on raw way', () => {
    const base = way(10, {
      highway: 'residential',
      'parking:left': 'lane',
    })
    const next = applyTableTagToWay(base, 'parking:right', 'street_side', true)
    expect(next.tags['parking:left']).toBe('street_side')
    expect(next.tags['parking:right']).toBeUndefined()
  })

  test('reversed clear deletes the raw (swapped) key', () => {
    const base = way(10, {
      highway: 'residential',
      'cycleway:right:surface': 'asphalt',
      'cycleway:left:surface': 'paving_stones',
    })
    const next = applyTableTagToWay(base, 'cycleway:left:surface', undefined, true)
    expect(next.tags['cycleway:right:surface']).toBeUndefined()
    expect(next.tags['cycleway:left:surface']).toBe('paving_stones')
  })

  test('non-reversed edit keeps the display key', () => {
    const base = way(10, { highway: 'residential', 'cycleway:left:surface': 'asphalt' })
    const next = applyTableTagToWay(base, 'cycleway:left:surface', 'concrete', false)
    expect(next.tags['cycleway:left:surface']).toBe('concrete')
  })

  test('propagate-style mutation on reversed segment swaps the key', () => {
    const base = way(11, { highway: 'primary', 'sidewalk:left:width': '1.5' })
    const next = applyTableTagToWay(base, 'sidewalk:right:width', '2.0', true)
    expect(next.tags['sidewalk:left:width']).toBe('2.0')
    expect(next.tags['sidewalk:right:width']).toBeUndefined()
  })
})

describe('resolveTableEditBaseWay + mergeWayEdit table', () => {
  test('pending parking tags are preserved when table edits an unrelated key', () => {
    clearChanges()
    const queryClient = new QueryClient()
    const key = osmCoverageSessionKey(currentOsmSessionParams())
    const initial = emptyOsmCoverageData()
    initial.graph.ways[5] = way(5, { highway: 'residential', name: 'Oak' })
    queryClient.setQueryData(key, initial)

    commitOsmWayChange(
      queryClient,
      way(5, { highway: 'residential', name: 'Oak', 'parking:both': 'lane' }),
      'parking',
    )

    // Simulate a stale session read without parking — handlers must use pending base.
    const staleSession = way(5, { highway: 'residential', name: 'Oak' })
    const base = resolveTableEditBaseWay(5, staleSession)
    expect(base?.tags['parking:both']).toBe('lane')

    const incoming = applyTableTagToWay(base!, 'surface', 'asphalt', false)
    commitOsmWayChange(queryClient, incoming, 'table')

    const sessionWay = getOsmWayFromSession(queryClient, 5)
    expect(sessionWay?.tags['parking:both']).toBe('lane')
    expect(sessionWay?.tags.surface).toBe('asphalt')
    clearChanges()
  })

  test('mergeWayEdit table full snapshot deletes an omitted key (not overwrite)', () => {
    const base = way(1, {
      highway: 'residential',
      surface: 'asphalt',
      'parking:both': 'lane',
    })
    // Incoming keeps parking, omits surface entirely — must not leave asphalt behind.
    const incoming = way(1, {
      highway: 'residential',
      'parking:both': 'lane',
    })
    const merged = mergeWayEdit(base, incoming, 'table')
    expect(merged.tags).toEqual({
      highway: 'residential',
      'parking:both': 'lane',
    })
    expect(merged.tags.surface).toBeUndefined()
  })
})
