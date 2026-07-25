import { describe, expect, test } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { nestSideTags } from '@osm-editor-kit/osm-sidepath-tags'
import {
  analyzeCategoryGaps,
  planTagsForCategory,
  processBikelanes,
} from '@tilda-geo/bicycle-infrastructure'
import {
  applyCategoryPlan,
  bikelaneSideFromRef,
} from '../modes/bicycle/domain/bicycle-edit-helpers'
import { parseBicycleFeaturesFromData } from '../modes/bicycle/map/parse-bikelanes'
import { mergeWayEdit } from '../shell/map/merge-way-edit'

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

describe('mergeWayEdit bicycle isolation', () => {
  test('bicycle edit only patches bike-related keys', () => {
    const base = way(1, {
      highway: 'residential',
      'parking:both': 'lane',
      width: '5',
      'cycleway:left': 'track',
    })
    const incoming = way(1, {
      highway: 'primary',
      'cycleway:left': 'lane',
      'cycleway:left:lane': 'exclusive',
      width: '9',
      'parking:both': 'no',
    })

    expect(mergeWayEdit(base, incoming, 'bicycle').tags).toEqual({
      highway: 'residential',
      'parking:both': 'lane',
      width: '5',
      'cycleway:left': 'lane',
      'cycleway:left:lane': 'exclusive',
    })
  })

  test('bicycle edit preserves parking and width tags from base', () => {
    const base = way(1, {
      highway: 'secondary',
      width: '7',
      'source:width': 'survey',
      'parking:lane:both': 'parallel',
      segregated: 'no',
    })
    const incoming = way(1, {
      highway: 'secondary',
      segregated: 'yes',
      is_sidepath: 'yes',
    })

    expect(mergeWayEdit(base, incoming, 'bicycle').tags).toEqual({
      highway: 'secondary',
      width: '7',
      'source:width': 'survey',
      'parking:lane:both': 'parallel',
      segregated: 'yes',
      is_sidepath: 'yes',
    })
  })
})

describe('parseBikelanes incomplete flag', () => {
  test('bare highway=cycleway is needsClarification and incomplete', () => {
    const tags = { highway: 'cycleway' }
    const results = processBikelanes(tags)
    const gaps = analyzeCategoryGaps(tags, results)
    const self = gaps.find((gap) => gap._side === 'self')

    expect(self?.category).toBe('needsClarification')
    expect(self?.incomplete).toBe(true)

    const graph = {
      ways: {
        1: {
          id: 1,
          type: 'way' as const,
          version: 1,
          changeset: 1,
          nodes: [10, 11],
          tags,
        },
      },
      nodes: {},
      nodeCoords: {
        10: [52.5, 13.4],
        11: [52.501, 13.401],
      },
    }

    const features = parseBicycleFeaturesFromData(graph, {
      south: 52.4,
      north: 52.6,
      west: 13.3,
      east: 13.5,
    })
    const highway = features.find((feature) => feature.properties.kind === 'highway')
    expect(highway?.properties.incomplete).toBe(true)
    expect(highway?.properties.category).toBe('needsClarification')
  })
})

describe('plan apply nests cycleway:right:lane', () => {
  test('apply suggestions nests lane on right side', () => {
    const tags = { highway: 'secondary', 'cycleway:right': 'lane' }
    const plan = planTagsForCategory(tags, 'cyclewayOnHighway_exclusive', { side: 'right' })
    const next = applyCategoryPlan(tags, plan)

    expect(next['cycleway:right:lane']).toBe('exclusive')

    const nested = nestSideTags(tags, 'cycleway', 'right', { lane: 'exclusive' })
    expect(next['cycleway:right:lane']).toBe(nested['cycleway:right:lane'])
  })

  test('bikelaneSideFromRef maps sidepath selection to left/right', () => {
    expect(bikelaneSideFromRef({ type: 'way', id: 1, prefix: 'cycleway', side: 'right' })).toBe(
      'right',
    )
    expect(bikelaneSideFromRef({ type: 'way', id: 1 })).toBe('self')
  })
})
