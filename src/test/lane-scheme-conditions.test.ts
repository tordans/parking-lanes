import {
  getLaneSchemeConditions,
  parseConditionsBySchemeV1,
  parseConditionsBySchemeV2,
  parseDefaultCondition,
} from '../parking/domain/lane-scheme-conditions'
import { type OsmTags } from '../utils/types/osm-data'

describe('lane-scheme conditions', () => {
  test('scheme v2 conditional with default tag', () => {
    const tags: OsmTags = {
      'parking:condition:right:conditional': 'ticket @ (Mo-Fr 08:00-18:00)',
      'parking:condition:right:default': 'free',
    }
    const conditions = getLaneSchemeConditions('right', tags)

    expect(conditions.default).toBe('free')
    expect(conditions.conditionalValues).toHaveLength(1)
    expect(conditions.conditionalValues![0].parkingCondition).toBe('ticket')
    expect(conditions.conditionalValues![0].condition).not.toBeNull()
  })

  test('scheme v1 indexed intervals', () => {
    const tags: OsmTags = {
      'parking:condition:right:default': 'free',
      'parking:condition:right': 'disc',
      'parking:condition:right:time_interval': '1-31/2',
      'parking:condition:right:2': 'ticket',
      'parking:condition:right:2:time_interval': '2-30/2',
    }
    const conditions = getLaneSchemeConditions('right', tags)

    expect(conditions.default).toBe('free')
    expect(conditions.conditionalValues).toHaveLength(2)
    expect(conditions.conditionalValues![0].parkingCondition).toBe('disc')
    expect(conditions.conditionalValues![0].condition).toBe('odd')
    expect(conditions.conditionalValues![1].parkingCondition).toBe('ticket')
    expect(conditions.conditionalValues![1].condition).toBe('even')
  })

  test('lane tag with parallel orientation maps to free default', () => {
    const tags: OsmTags = {
      'parking:lane:right': 'parallel',
    }
    expect(parseDefaultCondition('right', tags, 0)).toBe('free')
  })

  test('unsupported condition value', () => {
    const tags: OsmTags = {
      'parking:condition:right': 'mystery_value',
    }
    expect(parseDefaultCondition('right', tags, 0)).toBe('unsupported')
  })

  test('parseConditionsBySchemeV2 returns empty without conditional tag', () => {
    expect(parseConditionsBySchemeV2('right', {})).toStrictEqual([])
  })

  test('parseConditionsBySchemeV1 stops when first interval has no time', () => {
    const tags: OsmTags = {
      'parking:condition:right': 'free',
    }
    expect(parseConditionsBySchemeV1('right', tags)).toStrictEqual([])
  })

  test('prefers both-side scheme v2 tag', () => {
    const tags: OsmTags = {
      'parking:condition:both:conditional': 'disc @ (Mo-Fr 09:00-17:00)',
      'parking:condition:both:default': 'free',
    }
    const conditions = getLaneSchemeConditions('left', tags)

    expect(conditions.default).toBe('free')
    expect(conditions.conditionalValues![0].parkingCondition).toBe('disc')
  })
})
