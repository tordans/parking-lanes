import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { QueryClient } from '@tanstack/react-query'
import { mergeWayEdit } from '../shell/map/merge-way-edit'
import { emptyOsmCoverageData, osmCoverageSessionKey } from '../shell/map/osm-coverage-query'
import { commitOsmWayChange, getOsmWayFromSession } from '../shell/map/osm-session-way-edits'
import { clearChanges, listPendingChanges } from '../utils/changes-store'
import { changeSourceLabels } from '../utils/changeset-message'

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

describe('mergeWayEdit', () => {
  test('parking form snapshot keeps width tags from base', () => {
    const base = way(1, {
      highway: 'residential',
      width: '6',
      'source:width': 'street-space-editor',
      'parking:both': 'lane',
    })
    const incoming = way(1, {
      highway: 'residential',
      'parking:both': 'street_side',
    })

    expect(mergeWayEdit(base, incoming, 'parking').tags).toEqual({
      highway: 'residential',
      width: '6',
      'source:width': 'street-space-editor',
      'parking:both': 'street_side',
    })
  })

  test('parking can delete parking tags without dropping width', () => {
    const base = way(1, {
      highway: 'residential',
      width: '5',
      'parking:both': 'lane',
    })
    const incoming = way(1, { highway: 'residential' })

    expect(mergeWayEdit(base, incoming, 'parking').tags).toEqual({
      highway: 'residential',
      width: '5',
    })
  })

  test('width edit only patches width keys', () => {
    const base = way(1, {
      highway: 'residential',
      'parking:both': 'lane',
      width: '5',
    })
    const incoming = way(1, {
      highway: 'primary',
      width: '7.5',
      'source:width': 'street-space-editor',
    })

    expect(mergeWayEdit(base, incoming, 'width').tags).toEqual({
      highway: 'residential',
      'parking:both': 'lane',
      width: '7.5',
      'source:width': 'street-space-editor',
    })
  })
})

describe('commitOsmWayChange', () => {
  test('accumulates parking and width edits on one way for save + session', () => {
    clearChanges()
    const queryClient = new QueryClient()
    const key = osmCoverageSessionKey({})
    const initial = emptyOsmCoverageData()
    initial.graph.ways[42] = way(42, { highway: 'residential', name: 'Teststraße' })
    queryClient.setQueryData(key, initial)

    commitOsmWayChange(
      queryClient,
      way(42, { highway: 'residential', name: 'Teststraße', 'parking:both': 'lane' }),
      'parking',
    )
    commitOsmWayChange(
      queryClient,
      way(42, {
        highway: 'residential',
        // Intentionally omit parking tags — simulates a width-only payload / stale form.
        name: 'Teststraße',
        width: '6.5',
        'source:width': 'street-space-editor',
      }),
      'width',
    )

    const sessionWay = getOsmWayFromSession(queryClient, 42)
    expect(sessionWay?.tags['parking:both']).toBe('lane')
    expect(sessionWay?.tags.width).toBe('6.5')

    const pending = listPendingChanges()
    expect(pending).toHaveLength(1)
    expect(pending[0]!.sources.sort()).toEqual(['parking', 'width'])
    expect(changeSourceLabels(pending[0]!.sources)).toEqual(['parking', 'width'])
    expect(pending[0]!.tagChanges).toContainEqual({ key: 'parking:both', from: null, to: 'lane' })
    expect(pending[0]!.tagChanges).toContainEqual({ key: 'width', from: null, to: '6.5' })
    expect(pending[0]!.tagChanges).toContainEqual({
      key: 'source:width',
      from: null,
      to: 'street-space-editor',
    })

    clearChanges()
  })

  test('second mode merges onto pending even if session was overwritten', () => {
    clearChanges()
    const queryClient = new QueryClient()
    const key = osmCoverageSessionKey({})
    const initial = emptyOsmCoverageData()
    initial.graph.ways[7] = way(7, { highway: 'residential' })
    queryClient.setQueryData(key, initial)

    commitOsmWayChange(
      queryClient,
      way(7, { highway: 'residential', 'parking:both': 'lane' }),
      'parking',
    )

    // Simulate a coverage refetch that replaced the session with server tags.
    const wiped = emptyOsmCoverageData()
    wiped.graph.ways[7] = way(7, { highway: 'residential' })
    queryClient.setQueryData(key, wiped)

    commitOsmWayChange(
      queryClient,
      way(7, {
        highway: 'residential',
        width: '4',
        'source:width': 'street-space-editor',
      }),
      'width',
    )

    const pending = listPendingChanges()
    expect(pending).toHaveLength(1)
    expect(pending[0]!.way.tags['parking:both']).toBe('lane')
    expect(pending[0]!.way.tags.width).toBe('4')
    expect(getOsmWayFromSession(queryClient, 7)?.tags['parking:both']).toBe('lane')

    clearChanges()
  })
})
