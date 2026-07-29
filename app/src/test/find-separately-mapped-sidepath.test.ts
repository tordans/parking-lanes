import { describe, expect, test } from 'bun:test'
import type { OsmWay, ParsedOsmData } from '@osm-editor-kit/osm-data'
import destination from '@turf/destination'
import { point } from '@turf/helpers'
import {
  findSeparatelyMappedSidepath,
  isSeparatelyMappedSidepathCandidate,
} from '../modes/lanes/domain/find-separately-mapped-sidepath'

/** Northbound centreline around Berlin (~100 m). nodeCoords are [lat, lon]. */
const ROAD_START: [number, number] = [52.5, 13.4]
const ROAD_END: [number, number] = [52.5009, 13.4]

function offsetLonLat(
  latLon: [number, number],
  distanceM: number,
  bearingDeg: number,
): [number, number] {
  const [lat, lon] = latLon
  const moved = destination(point([lon, lat]), distanceM, bearingDeg, { units: 'meters' }).geometry
    .coordinates
  return [moved[1]!, moved[0]!]
}

function way(id: number, nodes: number[], tags: Record<string, string>): OsmWay {
  return {
    id,
    type: 'way',
    version: 1,
    changeset: 1,
    nodes,
    tags,
  }
}

function buildGraph(args: {
  roadNodes: Array<[number, number]>
  sidepaths: Array<{
    id: number
    tags: Record<string, string>
    nodes: Array<[number, number]>
  }>
}): ParsedOsmData {
  const nodeCoords: ParsedOsmData['nodeCoords'] = {}
  const ways: ParsedOsmData['ways'] = {}

  let nextNodeId = 1
  const roadNodeIds: number[] = []
  for (const coord of args.roadNodes) {
    const id = nextNodeId++
    roadNodeIds.push(id)
    nodeCoords[id] = coord
  }
  ways[1] = way(1, roadNodeIds, { highway: 'residential', 'sidewalk:both': 'separate' })

  for (const sidepath of args.sidepaths) {
    const nodeIds: number[] = []
    for (const coord of sidepath.nodes) {
      const id = nextNodeId++
      nodeIds.push(id)
      nodeCoords[id] = coord
    }
    ways[sidepath.id] = way(sidepath.id, nodeIds, sidepath.tags)
  }

  return {
    relations: {},
    ways,
    nodes: {},
    nodeCoords,
    waysInRelation: {},
  }
}

const left8m = [offsetLonLat(ROAD_START, 8, -90), offsetLonLat(ROAD_END, 8, -90)]
const right8m = [offsetLonLat(ROAD_START, 8, 90), offsetLonLat(ROAD_END, 8, 90)]
const left30m = [offsetLonLat(ROAD_START, 30, -90), offsetLonLat(ROAD_END, 30, -90)]

describe('isSeparatelyMappedSidepathCandidate', () => {
  test('accepts sidewalk-like highways and rejects crossings', () => {
    expect(isSeparatelyMappedSidepathCandidate({ highway: 'footway' }, 'sidewalk')).toBe(true)
    expect(
      isSeparatelyMappedSidepathCandidate({ highway: 'footway', footway: 'sidewalk' }, 'sidewalk'),
    ).toBe(true)
    expect(
      isSeparatelyMappedSidepathCandidate({ highway: 'footway', footway: 'crossing' }, 'sidewalk'),
    ).toBe(false)
    expect(isSeparatelyMappedSidepathCandidate({ highway: 'cycleway' }, 'sidewalk')).toBe(false)
  })

  test('accepts cycleways and bicycle-accessible paths', () => {
    expect(isSeparatelyMappedSidepathCandidate({ highway: 'cycleway' }, 'cycleway')).toBe(true)
    expect(
      isSeparatelyMappedSidepathCandidate({ highway: 'path', bicycle: 'designated' }, 'cycleway'),
    ).toBe(true)
    expect(isSeparatelyMappedSidepathCandidate({ highway: 'footway' }, 'cycleway')).toBe(false)
    expect(
      isSeparatelyMappedSidepathCandidate(
        { highway: 'cycleway', cycleway: 'crossing' },
        'cycleway',
      ),
    ).toBe(false)
  })

  test('rejects missing tags', () => {
    expect(isSeparatelyMappedSidepathCandidate(undefined, 'sidewalk')).toBe(false)
    expect(isSeparatelyMappedSidepathCandidate(undefined, 'cycleway')).toBe(false)
  })
})

describe('findSeparatelyMappedSidepath', () => {
  test('finds a parallel footway ~8 m on the left', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 10,
          tags: { highway: 'footway', footway: 'sidewalk' },
          nodes: left8m,
        },
      ],
    })

    const match = findSeparatelyMappedSidepath(graph, 1, { prefix: 'sidewalk', side: 'left' })
    expect(match?.wayId).toBe(10)
    expect(match?.distanceM).toBeGreaterThan(6)
    expect(match?.distanceM).toBeLessThan(10)
  })

  test('does not return a left footway when asking for the right side', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 10,
          tags: { highway: 'footway', footway: 'sidewalk' },
          nodes: left8m,
        },
      ],
    })

    expect(findSeparatelyMappedSidepath(graph, 1, { prefix: 'sidewalk', side: 'right' })).toBeNull()
  })

  test('ignores ways farther than 20 m', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 10,
          tags: { highway: 'footway', footway: 'sidewalk' },
          nodes: left30m,
        },
      ],
    })

    expect(findSeparatelyMappedSidepath(graph, 1, { prefix: 'sidewalk', side: 'left' })).toBeNull()
  })

  test('excludes crossing footways', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 10,
          tags: { highway: 'footway', footway: 'crossing' },
          nodes: left8m,
        },
      ],
    })

    expect(findSeparatelyMappedSidepath(graph, 1, { prefix: 'sidewalk', side: 'left' })).toBeNull()
  })

  test('prefers footway=sidewalk over bare footway at the same distance', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 10,
          tags: { highway: 'footway' },
          nodes: left8m,
        },
        {
          id: 11,
          tags: { highway: 'footway', footway: 'sidewalk' },
          nodes: left8m,
        },
      ],
    })

    expect(
      findSeparatelyMappedSidepath(graph, 1, { prefix: 'sidewalk', side: 'left' })?.wayId,
    ).toBe(11)
  })

  test('finds a cycleway on the right', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 20,
          tags: { highway: 'cycleway' },
          nodes: right8m,
        },
      ],
    })

    const match = findSeparatelyMappedSidepath(graph, 1, { prefix: 'cycleway', side: 'right' })
    expect(match?.wayId).toBe(20)
    expect(match?.distanceM).toBeLessThan(10)
  })

  test('does not match a sidewalk candidate when looking for a cycleway', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 10,
          tags: { highway: 'footway', footway: 'sidewalk' },
          nodes: left8m,
        },
      ],
    })

    expect(findSeparatelyMappedSidepath(graph, 1, { prefix: 'cycleway', side: 'left' })).toBeNull()
  })

  test('skips ways with missing tags without throwing', () => {
    const graph = buildGraph({
      roadNodes: [ROAD_START, ROAD_END],
      sidepaths: [
        {
          id: 10,
          tags: { highway: 'footway', footway: 'sidewalk' },
          nodes: left8m,
        },
      ],
    })
    graph.ways[99] = {
      id: 99,
      type: 'way',
      version: 1,
      changeset: 1,
      nodes: [],
      tags: undefined as unknown as Record<string, string>,
    }

    const match = findSeparatelyMappedSidepath(graph, 1, { prefix: 'sidewalk', side: 'left' })
    expect(match?.wayId).toBe(10)
  })
})
