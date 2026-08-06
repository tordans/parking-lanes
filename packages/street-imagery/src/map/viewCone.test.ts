import { describe, expect, it } from 'bun:test'
import { coneRadiusMeters, viewConeGeoJson } from './viewCone'

const apexRing = (feature: ReturnType<typeof viewConeGeoJson>): [number, number][] =>
  (feature.geometry.coordinates[0] ?? []) as [number, number][]

describe('viewConeGeoJson', () => {
  it('bearing 0 points north (arc points have higher latitude than apex)', () => {
    const apex: [number, number] = [13.4, 52.5]
    const feature = viewConeGeoJson(apex, 0, 60, 50)
    const ring = apexRing(feature)
    const arcPoints = ring.slice(1, -1)

    expect(arcPoints.length).toBeGreaterThan(0)
    for (const [lng, lat] of arcPoints) {
      expect(lat).toBeGreaterThan(apex[1])
      expect(lng).toBeCloseTo(apex[0], 3)
    }
  })

  it('bearing 90 points east (arc points have higher longitude than apex)', () => {
    const apex: [number, number] = [13.4, 52.5]
    const feature = viewConeGeoJson(apex, 90, 60, 50)
    const ring = apexRing(feature)
    const arcPoints = ring.slice(1, -1)

    expect(arcPoints.length).toBeGreaterThan(0)
    for (const [lng, lat] of arcPoints) {
      expect(lng).toBeGreaterThan(apex[0])
      expect(lat).toBeCloseTo(apex[1], 3)
    }
  })

  it('handles wraparound near the antimeridian and high bearings', () => {
    const apex: [number, number] = [179.5, 10]
    const feature = viewConeGeoJson(apex, 350, 40, 80)
    const ring = apexRing(feature)

    expect(ring.length).toBeGreaterThan(3)
    for (const [lng] of ring) {
      expect(Number.isFinite(lng)).toBe(true)
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThanOrEqual(180)
    }
  })

  it('bearing ~180 near lng 179.9999 points south with finite longitude values', () => {
    const apex: [number, number] = [179.9999, 10]
    const feature = viewConeGeoJson(apex, 180, 60, 50)
    const ring = apexRing(feature)
    const arcPoints = ring.slice(1, -1)

    expect(ring.length).toBeGreaterThan(3)
    expect(arcPoints.length).toBeGreaterThan(0)
    for (const [lng, lat] of arcPoints) {
      expect(Number.isFinite(lng)).toBe(true)
      expect(lat).toBeLessThan(apex[1])
    }
  })

  it('degenerate fov = 0 still returns a closed valid polygon', () => {
    const apex: [number, number] = [13.4, 52.5]
    const feature = viewConeGeoJson(apex, 45, 0, 50)
    const ring = apexRing(feature)

    expect(ring.length).toBeGreaterThanOrEqual(4)
    expect(ring[0]).toEqual(ring[ring.length - 1])
  })

  it('closes the ring (first coordinate equals last) for a normal cone', () => {
    const apex: [number, number] = [13.4, 52.5]
    const feature = viewConeGeoJson(apex, 0, 60, 50)
    const ring = apexRing(feature)

    expect(ring[0]).toEqual(ring[ring.length - 1])
  })

  it('widens the arc spread with larger fov', () => {
    const apex: [number, number] = [8.5, 47.4]
    const narrow = viewConeGeoJson(apex, 45, 20, 60)
    const wide = viewConeGeoJson(apex, 45, 80, 60)
    const narrowRing = apexRing(narrow)
    const wideRing = apexRing(wide)

    const spread = (ring: [number, number][]) => {
      const arc = ring.slice(1, -1)
      const lngs = arc.map(([lng]) => lng)
      const lats = arc.map(([, lat]) => lat)
      return Math.max(...lngs) - Math.min(...lngs) + (Math.max(...lats) - Math.min(...lats))
    }

    expect(spread(wideRing)).toBeGreaterThan(spread(narrowRing))
  })
})

describe('coneRadiusMeters', () => {
  it('uses ~50 m at zoom 14', () => {
    expect(coneRadiusMeters(14)).toBe(50)
  })

  it('scales monotonically when zooming in', () => {
    expect(coneRadiusMeters(15)).toBeLessThan(coneRadiusMeters(14))
    expect(coneRadiusMeters(16)).toBeLessThan(coneRadiusMeters(15))
  })

  it('scales monotonically when zooming out', () => {
    expect(coneRadiusMeters(13)).toBeGreaterThan(coneRadiusMeters(14))
    expect(coneRadiusMeters(12)).toBeGreaterThan(coneRadiusMeters(13))
  })
})
