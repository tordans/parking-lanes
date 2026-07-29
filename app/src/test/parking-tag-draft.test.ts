import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { QueryClient } from '@tanstack/react-query'
import { applyTagKeyChange, applyTagPatch } from '../components/tag-editor'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageSessionKey,
} from '../shell/map/osm-coverage-query'
import { reapplyPendingWaysToSession } from '../shell/map/osm-session-way-edits'
import { addChangedEntity, clearChanges } from '../utils/changes-store'

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

describe('applyTagKeyChange', () => {
  test('sets and clears a tag key without mutating the input', () => {
    const tags = { highway: 'residential' }
    const withMaxstay = applyTagKeyChange(tags, 'parking:both:maxstay', '30 minutes')
    expect(withMaxstay).toEqual({
      highway: 'residential',
      'parking:both:maxstay': '30 minutes',
    })
    expect(tags).toEqual({ highway: 'residential' })

    const cleared = applyTagKeyChange(withMaxstay, 'parking:both:maxstay', '')
    expect(cleared).toEqual({ highway: 'residential' })
  })
})

describe('applyTagPatch', () => {
  test('sets and deletes keys from a patch', () => {
    const tags = { highway: 'residential', surface: 'asphalt' }
    expect(applyTagPatch(tags, { surface: undefined, smoothness: 'good' })).toEqual({
      highway: 'residential',
      smoothness: 'good',
    })
    expect(tags).toEqual({ highway: 'residential', surface: 'asphalt' })
  })
})

describe('reapplyPendingWaysToSession', () => {
  test('writes pending ways back onto the session graph', () => {
    clearChanges()
    const queryClient = new QueryClient()
    const key = osmCoverageSessionKey(currentOsmSessionParams())
    queryClient.setQueryData(key, {
      ...emptyOsmCoverageData(),
      graph: {
        ...emptyOsmCoverageData().graph,
        ways: {
          7: way(7, { highway: 'residential' }),
        },
      },
    })

    addChangedEntity(way(7, { highway: 'residential', 'parking:both:maxstay': '2 hours' }), {
      source: 'parking',
    })
    reapplyPendingWaysToSession(queryClient)

    const stored = queryClient.getQueryData<ReturnType<typeof emptyOsmCoverageData>>(key)
    expect(stored?.graph.ways[7]?.tags['parking:both:maxstay']).toBe('2 hours')
    clearChanges()
  })
})
