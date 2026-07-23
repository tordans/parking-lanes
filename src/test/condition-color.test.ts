import { getColor, getColorByDate } from '../parking/domain/condition-color'
import { getSideConditions } from '../parking/domain/side-conditions'
import { type OsmTags } from '../utils/types/osm-data'

describe('condition color', () => {
    test('maps known conditions to legend colors', () => {
        expect(getColor('free')).toBe('limegreen')
        expect(getColor('ticket')).toBe('dodgerblue')
        expect(getColor('disc')).toBe('yellowgreen')
        expect(getColor('no_parking')).toBe('orange')
        expect(getColor('loading_only')).toBe('#ffe700')
    })

    test('returns undefined for unknown condition', () => {
        expect(getColor('unknown')).toBeUndefined()
        expect(getColor(null)).toBeUndefined()
    })

    test('uses default color when no conditional interval matches datetime', () => {
        const tags: OsmTags = {
            'parking:right': 'yes',
            'parking:right:fee': 'yes',
        }
        const conditions = getSideConditions('right', tags)
        const color = getColorByDate(conditions, new Date('2026-07-23T12:00:00'))

        expect(color).toBe('dodgerblue')
    })

    test('uses conditional color when interval matches datetime', () => {
        const tags: OsmTags = {
            'parking:right': 'yes',
            'parking:right:fee:conditional': 'yes @ 1-31/2; no @ 2-30/2',
        }
        const conditions = getSideConditions('right', tags)
        const oddDay = new Date('2026-07-23T12:00:00')
        const evenDay = new Date('2026-07-24T12:00:00')

        expect(getColorByDate(conditions, oddDay)).toBe('dodgerblue')
        expect(getColorByDate(conditions, evenDay)).toBe('limegreen')
    })

    test('legacy lane scheme fixture maps to expected default color', () => {
        const tags: OsmTags = {
            'parking:condition:right:conditional': 'ticket @ (Mo-Fr 08:00-18:00)',
            'parking:condition:right:default': 'free',
        }
        const conditions = getSideConditions('right', tags)

        expect(getColorByDate(conditions, new Date('2026-07-25T12:00:00'))).toBe('limegreen')
    })
})
