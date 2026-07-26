import { describe, expect, test } from 'bun:test'
import { parseParkingLaneFeatures } from '../modes/parking/map/parse-lanes'

describe('parseParkingLaneFeatures', () => {
  test('creates left and right lanes for highways without parking tags', () => {
    const way = {
      type: 'way' as const,
      id: 48802137,
      tags: { highway: 'residential', name: 'Bartastraße' },
      nodes: [1, 2],
    }
    const nodeCoords = {
      1: [52.475, 13.451],
      2: [52.476, 13.452],
    }

    const features = parseParkingLaneFeatures(way, nodeCoords, 16)
    expect(features).toHaveLength(2)
    expect(features.map((f) => f.properties.featureId)).toEqual(['right48802137', 'left48802137'])
    expect(features.map((f) => f.properties.side)).toEqual(['right', 'left'])
    expect(features[0]!.properties.offset).toBeGreaterThan(0)
    expect(features[1]!.properties.offset).toBeLessThan(0)
  })
})
