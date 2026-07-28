import { describe, expect, test } from 'bun:test'
import { parseParkingLaneFeatures } from '../modes/parking/map/parse-lanes'

describe('parseParkingLaneFeatures', () => {
  test('creates a missing centerline feature for highways without parking tags', () => {
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

    const features = parseParkingLaneFeatures(way, nodeCoords, 16, 'public')
    expect(features).toHaveLength(1)
    expect(features[0]!.properties).toMatchObject({
      featureId: 'empty48802137',
      kind: 'missing',
      offset: 0,
      osmId: 48802137,
    })
  })

  test('skips private driveways in the public inclusion style', () => {
    const way = {
      type: 'way' as const,
      id: 1,
      tags: { highway: 'service', service: 'driveway' },
      nodes: [1, 2],
    }
    const nodeCoords = {
      1: [52.475, 13.451],
      2: [52.476, 13.452],
    }

    expect(parseParkingLaneFeatures(way, nodeCoords, 16, 'public')).toHaveLength(0)
    expect(parseParkingLaneFeatures(way, nodeCoords, 16, 'inclusive')).toHaveLength(1)
    expect(parseParkingLaneFeatures(way, nodeCoords, 16, 'inclusive')[0]!.properties.kind).toBe(
      'missing',
    )
  })
})
