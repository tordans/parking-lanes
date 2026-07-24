import { type OsmTags } from '@osm-editor-kit/osm-data'
import { getSideConditions } from '../parking/domain/side-conditions'

describe('side conditions', () => {
  test('prefers new parking scheme over legacy lane scheme', () => {
    const tags: OsmTags = {
      'parking:right': 'yes',
      'parking:right:fee': 'yes',
      'parking:condition:right:conditional': 'free @ (Mo-Fr 08:00-18:00)',
      'parking:condition:right:default': 'ticket',
    }
    const conditions = getSideConditions('right', tags)

    expect(conditions.default).toBe('ticket')
    expect(conditions.conditionalValues).toHaveLength(0)
  })

  test('falls back to legacy lane scheme when new scheme has no default', () => {
    const tags: OsmTags = {
      'parking:condition:right:conditional': 'ticket @ (Mo-Fr 08:00-18:00)',
      'parking:condition:right:default': 'free',
    }
    const conditions = getSideConditions('right', tags)

    expect(conditions.default).toBe('free')
    expect(conditions.conditionalValues).toHaveLength(1)
    expect(conditions.conditionalValues![0].parkingCondition).toBe('ticket')
  })

  test('uses access scheme for parking:right tags without legacy tags', () => {
    const tags: OsmTags = {
      'parking:right': 'street_side',
      'parking:right:maxstay': '15 minutes',
    }
    const conditions = getSideConditions('right', tags)

    expect(conditions.default).toBe('disc')
    expect(conditions.conditionalValues).toStrictEqual([])
  })
})
