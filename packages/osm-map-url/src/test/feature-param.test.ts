import { parseFeatureParam, serializeFeatureParam } from '../feature-param'

describe('feature param', () => {
  test('parseFeatureParam accepts way/node/relation ids', () => {
    expect(parseFeatureParam('way/123')).toEqual({ type: 'way', id: 123 })
    expect(parseFeatureParam('node/456')).toEqual({ type: 'node', id: 456 })
    expect(parseFeatureParam('relation/789')).toEqual({ type: 'relation', id: 789 })
  })

  test('parseFeatureParam rejects invalid values', () => {
    expect(parseFeatureParam('invalid')).toBeNull()
    expect(parseFeatureParam('way/0')).toBeNull()
    expect(parseFeatureParam('way/-1')).toBeNull()
    expect(parseFeatureParam('foo/123')).toBeNull()
    expect(parseFeatureParam('way')).toBeNull()
    expect(parseFeatureParam('way/1/2')).toBeNull()
  })

  test('serializeFeatureParam round-trips', () => {
    const ref = { type: 'way' as const, id: 42 }
    expect(serializeFeatureParam(ref)).toBe('way/42')
    expect(parseFeatureParam(serializeFeatureParam(ref))).toEqual(ref)
  })
})
