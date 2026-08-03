import { readFileSync } from 'node:fs'
import type { OsmMapFixtureIndex } from './filter-elements-by-bbox'
import type { MapBbox, OsmMapElement } from './types'

const indexCache = new Map<string, OsmMapFixtureIndex>()

const GRID_COLS = 64
const GRID_ROWS = 64

type NodeGrid = {
  west: number
  south: number
  east: number
  north: number
  cols: number
  rows: number
  cells: number[][]
}

function buildNodeGrid(nodesById: Map<number, OsmMapElement>): NodeGrid | null {
  let west = Number.POSITIVE_INFINITY
  let south = Number.POSITIVE_INFINITY
  let east = Number.NEGATIVE_INFINITY
  let north = Number.NEGATIVE_INFINITY

  for (const node of nodesById.values()) {
    const { lat, lon } = node
    if (lat == null || lon == null) continue
    west = Math.min(west, lon)
    south = Math.min(south, lat)
    east = Math.max(east, lon)
    north = Math.max(north, lat)
  }

  if (!Number.isFinite(west)) return null

  const lonSpan = east - west || 1
  const latSpan = north - south || 1
  const cells: number[][] = Array.from({ length: GRID_COLS * GRID_ROWS }, () => [])

  for (const node of nodesById.values()) {
    const { lat, lon, id } = node
    if (lat == null || lon == null) continue
    const col = Math.min(
      GRID_COLS - 1,
      Math.max(0, Math.floor(((lon - west) / lonSpan) * GRID_COLS)),
    )
    const row = Math.min(
      GRID_ROWS - 1,
      Math.max(0, Math.floor(((lat - south) / latSpan) * GRID_ROWS)),
    )
    cells[col + row * GRID_COLS]!.push(id)
  }

  return { west, south, east, north, cols: GRID_COLS, rows: GRID_ROWS, cells }
}

function nodeIdsInBboxFromGrid(grid: NodeGrid | null, bbox: MapBbox): number[] {
  if (!grid) return []

  if (
    bbox.east < grid.west ||
    bbox.west > grid.east ||
    bbox.north < grid.south ||
    bbox.south > grid.north
  ) {
    return []
  }

  const lonSpan = grid.east - grid.west || 1
  const latSpan = grid.north - grid.south || 1

  const colMin = Math.max(
    0,
    Math.floor(((Math.max(bbox.west, grid.west) - grid.west) / lonSpan) * grid.cols),
  )
  const colMax = Math.min(
    grid.cols - 1,
    Math.floor(((Math.min(bbox.east, grid.east) - grid.west) / lonSpan) * grid.cols),
  )
  const rowMin = Math.max(
    0,
    Math.floor(((Math.max(bbox.south, grid.south) - grid.south) / latSpan) * grid.rows),
  )
  const rowMax = Math.min(
    grid.rows - 1,
    Math.floor(((Math.min(bbox.north, grid.north) - grid.south) / latSpan) * grid.rows),
  )

  const ids = new Set<number>()
  for (let row = rowMin; row <= rowMax; row += 1) {
    for (let col = colMin; col <= colMax; col += 1) {
      for (const nodeId of grid.cells[col + row * grid.cols]!) {
        ids.add(nodeId)
      }
    }
  }

  return [...ids]
}

function buildIndex(elements: OsmMapElement[]): OsmMapFixtureIndex {
  const nodesById = new Map<number, OsmMapElement>()
  const waysById = new Map<number, OsmMapElement>()
  const relationsById = new Map<number, OsmMapElement>()
  const wayIdsByNodeId = new Map<number, number[]>()

  for (const element of elements) {
    if (element.type === 'node') {
      nodesById.set(element.id, element)
    } else if (element.type === 'way') {
      waysById.set(element.id, element)
      for (const nodeId of element.nodes ?? []) {
        const existing = wayIdsByNodeId.get(nodeId)
        if (existing) {
          existing.push(element.id)
        } else {
          wayIdsByNodeId.set(nodeId, [element.id])
        }
      }
    } else if (element.type === 'relation') {
      relationsById.set(element.id, element)
    }
  }

  const grid = buildNodeGrid(nodesById)

  return {
    nodesById,
    waysById,
    relationsById,
    wayIdsByNodeId,
    nodeIdsInBbox: (bbox) => {
      const candidateIds = nodeIdsInBboxFromGrid(grid, bbox)
      const inBbox: number[] = []
      for (const nodeId of candidateIds) {
        const node = nodesById.get(nodeId)
        if (!node) continue
        const { lat, lon } = node
        if (lat == null || lon == null) continue
        if (lon >= bbox.west && lon <= bbox.east && lat >= bbox.south && lat <= bbox.north) {
          inBbox.push(nodeId)
        }
      }
      return inBbox
    },
  }
}

/** Read `{ elements }` once per process and build lookup indexes for bbox queries. */
export function loadOsmMapFixtureIndex(filePath: string): OsmMapFixtureIndex {
  const cached = indexCache.get(filePath)
  if (cached) return cached

  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as { elements?: OsmMapElement[] }
  const elements = Array.isArray(raw.elements) ? raw.elements : []
  const index = buildIndex(elements)
  indexCache.set(filePath, index)
  return index
}
