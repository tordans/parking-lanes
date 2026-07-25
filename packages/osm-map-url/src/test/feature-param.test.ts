import { parseFeatureParam, serializeFeatureParam } from '../feature-param'

describe('feature param', () => {
  test('parseFeatureParam accepts way/node/relation ids', () => {
    expect(parseFeatureParam('way/123')).toEqual({ type: 'way', id: 123 })
    expect(parseFeatureParam('node/456')).toEqual({ type: 'node', id: 456 })
    expect(parseFeatureParam('relation/789')).toEqual({ type: 'relation', id: 789 })
  })

  test('parseFeatureParam accepts sidepath refs', () => {
    expect(parseFeatureParam('way/123/cycleway/left')).toEqual({
      type: 'way',
      id: 123,
      prefix: 'cycleway',
      side: 'left',
    })
    expect(parseFeatureParam('way/42/sidewalk/right')).toEqual({
      type: 'way',
      id: 42,
      prefix: 'sidewalk',
      side: 'right',
    })
  })

  test('parseFeatureParam rejects invalid values', () => {
    expect(parseFeatureParam('invalid')).toBeNull()
    expect(parseFeatureParam('way/0')).toBeNull()
    expect(parseFeatureParam('way/-1')).toBeNull()
    expect(parseFeatureParam('foo/123')).toBeNull()
    expect(parseFeatureParam('way')).toBeNull()
    expect(parseFeatureParam('way/1/2')).toBeNull()
    expect(parseFeatureParam('node/1/cycleway/left')).toBeNull()
    expect(parseFeatureParam('way/1/both/left')).toBeNull()
    expect(parseFeatureParam('way/1/cycleway/both')).toBeNull()
  })

  test('serializeFeatureParam round-trips plain and sidepath refs', () => {
    const plain = { type: 'way' as const, id: 42 }
    expect(serializeFeatureParam(plain)).toBe('way/42')
    expect(parseFeatureParam(serializeFeatureParam(plain))).toEqual(plain)

    const sidepath = {
      type: 'way' as const,
      id: 42,
      prefix: 'cycleway' as const,
      side: 'left' as const,
    }
    expect(serializeFeatureParam(sidepath)).toBe('way/42/cycleway/left')
    expect(parseFeatureParam(serializeFeatureParam(sidepath))).toEqual(sidepath)
  })
})
