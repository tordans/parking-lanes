import { describe, expect, it } from 'bun:test'
import type { Bbox } from './model'
import { clampZoom, isNullIslandTile, lonToTileX, latToTileY, tilesForBbox } from './tileMath'

describe('tileMath', () => {
  it('converts Berlin center to z14 tile coordinates', () => {
    expect(lonToTileX(13.405, 14)).toBe(8802)
    expect(latToTileY(52.52, 14)).toBe(5373)
  })

  it('clamps zoom to integer bounds', () => {
    expect(clampZoom(12.7, 10, 15)).toBe(12)
    expect(clampZoom(9.2, 10, 15)).toBe(10)
    expect(clampZoom(16.9, 10, 15)).toBe(15)
  })

  it('returns tiles covering a small bbox', () => {
    const bbox: Bbox = [13.4, 52.5, 13.41, 52.51]
    const tiles = tilesForBbox(bbox, 14)
    expect(tiles.length).toBeGreaterThan(0)
    expect(tiles.every((tile) => tile.z === 14)).toBe(true)
  })

  it('wraps longitudes beyond 180 into valid tile x', () => {
    const bbox: Bbox = [185, 52.5, 186, 52.51]
    const tiles = tilesForBbox(bbox, 8)
    expect(tiles.length).toBeGreaterThan(0)
    expect(tiles.every((tile) => tile.x >= 0 && tile.x < 2 ** 8)).toBe(true)
    // 185°E wraps to -175°E
    expect(tiles.some((tile) => tile.x === lonToTileX(-175, 8))).toBe(true)
  })

  it('never produces negative tile x for longitudes below -180', () => {
    const bbox: Bbox = [-190, 10, -185, 11]
    const tiles = tilesForBbox(bbox, 6)
    expect(tiles.length).toBeGreaterThan(0)
    expect(tiles.every((tile) => tile.x >= 0 && tile.x < 2 ** 6)).toBe(true)
  })

  it('clamps latitudes beyond the mercator limit to valid tile y', () => {
    const bbox: Bbox = [10, 84, 11, 89.9]
    const tiles = tilesForBbox(bbox, 5)
    expect(tiles.length).toBeGreaterThan(0)
    expect(tiles.every((tile) => tile.y >= 0 && tile.y < 2 ** 5)).toBe(true)
  })

  it('falls back to the full x range when west > east', () => {
    const bbox: Bbox = [170, 50, -170, 51]
    const tiles = tilesForBbox(bbox, 2)
    const xs = new Set(tiles.map((tile) => tile.x))
    expect(xs).toEqual(new Set([0, 1, 2, 3]))
  })

  it('skips null island tiles when requested', () => {
    const nullIslandBbox: Bbox = [-0.5, -0.5, 0.5, 0.5]
    const withSkip = tilesForBbox(nullIslandBbox, 14, { skipNullIsland: true })
    const withoutSkip = tilesForBbox(nullIslandBbox, 14)
    expect(withSkip.length).toBeLessThan(withoutSkip.length)
    expect(withSkip.every((tile) => !isNullIslandTile(tile))).toBe(true)
  })
})
