import { describe, expect, test } from 'bun:test'
import { classifyWidthInfra } from '../modes/width/domain/width-infra-class'

describe('classifyWidthInfra', () => {
  test('classifies motor highways as car', () => {
    expect(classifyWidthInfra({ highway: 'motorway' })).toBe('car')
    expect(classifyWidthInfra({ highway: 'residential' })).toBe('car')
    expect(classifyWidthInfra({ highway: 'living_street' })).toBe('car')
    expect(classifyWidthInfra({ highway: 'service' })).toBe('car')
  })

  test('classifies dedicated cycle infrastructure as bicycle', () => {
    expect(classifyWidthInfra({ highway: 'cycleway' })).toBe('bicycle')
    expect(classifyWidthInfra({ highway: 'path', bicycle: 'designated' })).toBe('bicycle')
    expect(classifyWidthInfra({ highway: 'footway', bicycle: 'yes' })).toBe('bicycle')
  })

  test('classifies undesignated paths and footways as other', () => {
    expect(classifyWidthInfra({ highway: 'footway' })).toBe('other')
    expect(classifyWidthInfra({ highway: 'path' })).toBe('other')
    expect(classifyWidthInfra({ highway: 'steps' })).toBe('other')
    expect(classifyWidthInfra({ highway: 'bridleway' })).toBe('other')
    expect(classifyWidthInfra({ highway: 'track' })).toBe('other')
    expect(classifyWidthInfra({ highway: 'pedestrian' })).toBe('other')
  })
})
