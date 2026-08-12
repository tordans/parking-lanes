import { describe, expect, test } from 'bun:test'
import { emptyParsedOsmData } from '@osm-editor-kit/osm-data'
import {
  countRoadWays,
  coverageGraphSignature,
  parsedOsmWaysToFeatureCollection,
} from '../ways-geojson'

describe('ways-geojson', () => {
  test('builds LineStrings and counts ways from ParsedOsmData', () => {
    const graph = emptyParsedOsmData()
    graph.nodeCoords[1] = [52.5, 13.4]
    graph.nodeCoords[2] = [52.51, 13.41]
    graph.ways[10] = {
      type: 'way',
      id: 10,
      nodes: [1, 2],
      version: 1,
      changeset: 0,
      tags: { highway: 'residential' },
    }

    expect(countRoadWays(graph)).toBe(1)
    expect(coverageGraphSignature(graph)).toBe('1:0:2')

    const collection = parsedOsmWaysToFeatureCollection(graph)
    expect(collection.features).toHaveLength(1)
    expect(collection.features[0]?.geometry.coordinates).toEqual([
      [13.4, 52.5],
      [13.41, 52.51],
    ])
  })
})
