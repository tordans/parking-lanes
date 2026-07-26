import { describe, expect, it } from 'bun:test'
import type { OsmWay } from '@osm-editor-kit/osm-data'
import { emptyParsedOsmData } from '@osm-editor-kit/osm-data'
import { createSessionGraphAdapter } from '../session-graph-adapter'
import { buildChain } from '../traversal/buildChain'

function makeWay(
  id: number,
  nodes: number[],
  tags: Record<string, string> = { highway: 'primary' },
): OsmWay {
  return {
    type: 'way',
    id,
    version: 1,
    changeset: 1,
    nodes,
    tags,
  }
}

describe('createSessionGraphAdapter', () => {
  it('builds chains from loaded session graph data', async () => {
    const graph = emptyParsedOsmData()
    graph.ways = {
      100: makeWay(100, [1, 2]),
      101: makeWay(101, [2, 3]),
      102: makeWay(102, [0, 1]),
    }
    graph.nodeCoords = {
      0: [52.0, 13.0],
      1: [52.0, 13.001],
      2: [52.0, 13.002],
      3: [52.0, 13.003],
    }

    const adapter = createSessionGraphAdapter(graph)
    const { chain } = await buildChain(adapter, { centerWayId: 100, maxPerSide: 2 })

    expect(chain.segments.map((segment) => segment.id)).toEqual([102, 100, 101])
    expect(chain.segments[0]!.geometry.coordinates[0]).toEqual([13.0, 52.0])
  })
})
