import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { QueryClient } from '@tanstack/react-query'
import { mergeWayEdit } from '../shell/map/merge-way-edit'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageSessionKey,
} from '../shell/map/osm-coverage-query'
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

  test('width edit patches nested sidepath width keys', () => {
    const base = way(1, {
      highway: 'residential',
      'parking:both': 'lane',
      'cycleway:left': 'track',
    })
    const incoming = way(1, {
      highway: 'primary',
      'cycleway:left:width': '2.0',
      'source:cycleway:left:width': 'street-space-editor',
    })

    expect(mergeWayEdit(base, incoming, 'width').tags).toEqual({
      highway: 'residential',
      'parking:both': 'lane',
      'cycleway:left': 'track',
      'cycleway:left:width': '2.0',
      'source:cycleway:left:width': 'street-space-editor',
    })
  })

  test('width edit keeps other sidepath width tags from base', () => {
    const base = way(1, {
      highway: 'residential',
      'sidewalk:right:width': '1.5',
      'source:sidewalk:right:width': 'survey',
    })
    const incoming = way(1, {
      'cycleway:left:width': '2.0',
      'source:cycleway:left:width': 'street-space-editor',
    })

    expect(mergeWayEdit(base, incoming, 'width').tags).toEqual({
      highway: 'residential',
      'sidewalk:right:width': '1.5',
      'source:sidewalk:right:width': 'survey',
      'cycleway:left:width': '2.0',
      'source:cycleway:left:width': 'street-space-editor',
    })
  })

  test('surface edit only patches surface/smoothness keys', () => {
    const base = way(1, {
      highway: 'residential',
      'parking:both': 'lane',
      width: '5',
      surface: 'asphalt',
    })
    const incoming = way(1, {
      highway: 'primary',
      smoothness: 'good',
      width: '9',
      'cycleway:left:surface': 'paving_stones',
      'footway:smoothness': 'intermediate',
      'sett:length': '0.13',
    })

    expect(mergeWayEdit(base, incoming, 'surface').tags).toEqual({
      highway: 'residential',
      'parking:both': 'lane',
      width: '5',
      surface: 'asphalt',
      smoothness: 'good',
      'cycleway:left:surface': 'paving_stones',
      'footway:smoothness': 'intermediate',
      'sett:length': '0.13',
    })
  })

  test('surface edit preserves nested sett:length keys', () => {
    const base = way(1, {
      highway: 'residential',
      surface: 'asphalt',
      parking: 'lane',
    })
    const incoming = way(1, {
      highway: 'primary',
      parking: 'no',
      'cycleway:left:sett:length': '0.08',
      'cycleway:right:sett:length': '0.13',
      'cycleway:both:sett:length': '0.15',
      'cycleway:sett:length': '0.12',
      'footway:sett:length': '0.1',
      'footway:left:sett:length': '0.07',
    })

    expect(mergeWayEdit(base, incoming, 'surface').tags).toEqual({
      highway: 'residential',
      surface: 'asphalt',
      parking: 'lane',
      'cycleway:left:sett:length': '0.08',
      'cycleway:right:sett:length': '0.13',
      'cycleway:both:sett:length': '0.15',
      'cycleway:sett:length': '0.12',
      'footway:sett:length': '0.1',
      'footway:left:sett:length': '0.07',
    })
  })
})

describe('commitOsmWayChange', () => {
  test('accumulates parking and width edits on one way for save + session', () => {
    clearChanges()
    const queryClient = new QueryClient()
    const key = osmCoverageSessionKey(currentOsmSessionParams())
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
    const key = osmCoverageSessionKey(currentOsmSessionParams())
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

  test('accumulates parking and nested sidepath width edits on one way', () => {
    clearChanges()
    const queryClient = new QueryClient()
    const key = osmCoverageSessionKey(currentOsmSessionParams())
    const initial = emptyOsmCoverageData()
    initial.graph.ways[42] = way(42, { highway: 'residential', 'cycleway:left': 'track' })
    queryClient.setQueryData(key, initial)

    commitOsmWayChange(
      queryClient,
      way(42, { highway: 'residential', 'cycleway:left': 'track', 'parking:both': 'lane' }),
      'parking',
    )
    commitOsmWayChange(
      queryClient,
      way(42, {
        highway: 'residential',
        'cycleway:left:width': '2.0',
        'source:cycleway:left:width': 'street-space-editor',
      }),
      'width',
    )

    const sessionWay = getOsmWayFromSession(queryClient, 42)
    expect(sessionWay?.tags['parking:both']).toBe('lane')
    expect(sessionWay?.tags['cycleway:left:width']).toBe('2.0')
    expect(sessionWay?.tags['source:cycleway:left:width']).toBe('street-space-editor')

    const pending = listPendingChanges()
    expect(pending).toHaveLength(1)
    expect(pending[0]!.tagChanges).toContainEqual({
      key: 'cycleway:left:width',
      from: null,
      to: '2.0',
    })
    expect(pending[0]!.tagChanges).toContainEqual({
      key: 'source:cycleway:left:width',
      from: null,
      to: 'street-space-editor',
    })

    clearChanges()
  })
})
