import { describe, expect, test } from 'bun:test'
import {
  bandContentX,
  crossSectionLayout,
  kerbBodySide,
  PX_PER_M,
  sumBandMetres,
} from '../modes/width/measure-guide/cross-section/layout'
import {
  allCrossSectionSpecs,
  cyclewayBufferSpec,
  estWidthProvenanceSpec,
  pathSegregatedSpec,
  roadKerbSpec,
  roadWidthVsLanesSpec,
  vergeSpec,
} from '../modes/width/measure-guide/specs'

function primaryWidthDim(spec: (typeof allCrossSectionSpecs)[number], key = 'width=*') {
  const dim = spec.dimensions.find((d) => d.key === key)
  if (!dim) throw new Error(`No dimension ${key} on ${spec.id}`)
  return dim
}

describe('cross-section spec sums (research figures)', () => {
  test('§3.2 Scenario A width=* = 6.36', () => {
    const dim = primaryWidthDim(roadWidthVsLanesSpec)
    expect(sumBandMetres(roadWidthVsLanesSpec.bands, dim.from, dim.to)).toBeCloseTo(6.36, 5)
    expect(roadWidthVsLanesSpec.research).toBe('§3.2 Scenario A')
  })

  test('§3.3 Scenario B width=* = 8.0', () => {
    const dim = primaryWidthDim(roadKerbSpec)
    expect(sumBandMetres(roadKerbSpec.bands, dim.from, dim.to)).toBeCloseTo(8.0, 5)
    expect(roadKerbSpec.research).toBe('§3.3 Scenario B')
  })

  test('§3.3 Scenario B width:lanes is one pipe over motor|cycle (parking+buffer out)', () => {
    const laneDims = roadKerbSpec.dimensions.filter((d) => d.key === 'width:lanes')
    expect(laneDims).toHaveLength(1)
    expect(laneDims[0]!.pipeSlots).toEqual([1, 3])
    expect(laneDims[0]!.from).toBe(1)
    expect(laneDims[0]!.to).toBe(3)

    const layout = crossSectionLayout(roadKerbSpec, 'audit')
    const laid = layout.dimensions.find((d) => d.key === 'width:lanes')!
    expect(laid.pipeLabel).toBe(true)
    expect(laid.parts).toEqual([3, 2])
    expect(laid.total).toBeCloseTo(5.0, 5)
    expect(laid.labelText).toBe('width:lanes=3|2*')
    expect(laid.segments).toHaveLength(2)
    // Segments sit on motor and cycle only — not the buffer gap.
    expect(laid.segments[0]!.x1).toBeCloseTo(layout.bands[1]!.x, 5)
    expect(laid.segments[0]!.x2).toBeCloseTo(layout.bands[1]!.x + layout.bands[1]!.width, 5)
    expect(laid.segments[1]!.x1).toBeCloseTo(layout.bands[3]!.x, 5)
    expect(laid.segments[1]!.x2).toBeCloseTo(layout.bands[3]!.x + layout.bands[3]!.width, 5)
    // Label span covers first→last slot (includes buffer geometrically).
    expect(laid.x1).toBeCloseTo(layout.bands[1]!.x, 5)
    expect(laid.x2).toBeCloseTo(layout.bands[3]!.x + layout.bands[3]!.width, 5)
    // Never encode metre values inside dimension keys.
    for (const spec of allCrossSectionSpecs) {
      for (const dim of spec.dimensions) {
        expect(dim.key).not.toMatch(/=\d/)
      }
    }
  })

  test('§2.8 buffer = 1.00 and cycle = 2.00', () => {
    const buffer = cyclewayBufferSpec.dimensions.find((d) => d.key.includes('buffer'))
    const cycle = cyclewayBufferSpec.dimensions.find((d) => d.key.includes('width'))
    expect(buffer).toBeDefined()
    expect(cycle).toBeDefined()
    expect(sumBandMetres(cyclewayBufferSpec.bands, buffer!.from, buffer!.to)).toBeCloseTo(1.0, 5)
    expect(sumBandMetres(cyclewayBufferSpec.bands, cycle!.from, cycle!.to)).toBeCloseTo(2.0, 5)
    expect(cyclewayBufferSpec.research).toBe('§2.8')
  })

  test('§2.7 path-segregated width=* = 3.5', () => {
    const dim = primaryWidthDim(pathSegregatedSpec)
    expect(sumBandMetres(pathSegregatedSpec.bands, dim.from, dim.to)).toBeCloseTo(3.5, 5)
    expect(pathSegregatedSpec.research).toBe('§2.7')
  })

  test('source:width is non-metric (no metre total on the label)', () => {
    const source = estWidthProvenanceSpec.dimensions.find((d) => d.key === 'source:width')
    const est = estWidthProvenanceSpec.dimensions.find((d) => d.key === 'est_width')
    expect(source?.showMetres).toBe(false)
    expect(est?.showMetres).not.toBe(false)

    const layout = crossSectionLayout(estWidthProvenanceSpec, 'audit')
    const sourceLaid = layout.dimensions.find((d) => d.key === 'source:width')
    expect(sourceLaid?.showMetres).toBe(false)
  })

  test('illustrative flag marks teaching metres, not research scenarios', () => {
    const researchIds = new Set([
      'road-kerb',
      'road-width-vs-lanes',
      'cycleway-clear',
      'cycleway-buffer',
      'path-segregated',
      'est-width-provenance',
    ])
    for (const spec of allCrossSectionSpecs) {
      if (researchIds.has(spec.id)) {
        expect(spec.illustrative).not.toBe(true)
      } else {
        expect(spec.illustrative).toBe(true)
      }
    }
  })
})

describe('cross-section layout invariants (all specs)', () => {
  for (const spec of allCrossSectionSpecs) {
    test(`${spec.id}: offsets increase, indices valid, arrow extent matches scale`, () => {
      expect(spec.research.length).toBeGreaterThan(0)
      expect(spec.bands.length).toBeGreaterThan(0)

      const layout = crossSectionLayout(spec, 'audit')

      // Band offsets strictly increase
      for (let i = 1; i < layout.bands.length; i++) {
        expect(layout.bands[i]!.x).toBeGreaterThan(layout.bands[i - 1]!.x)
      }

      // Band widths match metres × scale
      for (const band of layout.bands) {
        expect(band.width).toBeCloseTo(band.m * PX_PER_M, 5)
      }

      for (const dim of spec.dimensions) {
        expect(dim.from).toBeGreaterThanOrEqual(0)
        expect(dim.to).toBeLessThan(spec.bands.length)
        expect(dim.from).toBeLessThanOrEqual(dim.to)

        const laid = layout.dimensions.find(
          (d) => d.key === dim.key && d.from === dim.from && d.to === dim.to,
        )
        expect(laid).toBeDefined()

        if (dim.pipeSlots?.length) {
          for (const i of dim.pipeSlots) {
            expect(i).toBeGreaterThanOrEqual(0)
            expect(i).toBeLessThan(spec.bands.length)
          }
          const expectedParts = dim.pipeSlots.map((i) => spec.bands[i]!.m)
          const expectedM = expectedParts.reduce((s, m) => s + m, 0)
          expect(laid!.pipeLabel).toBe(true)
          expect(laid!.parts).toEqual(expectedParts)
          expect(laid!.total).toBeCloseTo(expectedM, 5)
          expect(laid!.segments).toHaveLength(dim.pipeSlots.length)
          for (let s = 0; s < dim.pipeSlots.length; s++) {
            const band = layout.bands[dim.pipeSlots[s]!]!
            expect(laid!.segments[s]!.x1).toBeCloseTo(band.x, 5)
            expect(laid!.segments[s]!.x2).toBeCloseTo(band.x + band.width, 5)
          }
          expect(laid!.x1).toBeCloseTo(layout.bands[dim.pipeSlots[0]!]!.x, 5)
          const lastSlot = layout.bands[dim.pipeSlots[dim.pipeSlots.length - 1]!]!
          expect(laid!.x2).toBeCloseTo(lastSlot.x + lastSlot.width, 5)
        } else {
          const expectedM = sumBandMetres(spec.bands, dim.from, dim.to)
          const expectedPx = expectedM * PX_PER_M
          expect(laid!.pipeLabel).toBe(false)
          expect(laid!.total).toBeCloseTo(expectedM, 5)
          expect(laid!.x2 - laid!.x1).toBeCloseTo(expectedPx, 5)
          expect(laid!.segments).toHaveLength(1)
          expect(laid!.x1).toBeCloseTo(layout.bands[dim.from]!.x, 5)
          const last = layout.bands[dim.to]!
          expect(laid!.x2).toBeCloseTo(last.x + last.width, 5)
        }
      }

      // kerbAt boundaries are valid
      for (const b of spec.kerbAt ?? []) {
        expect(b).toBeGreaterThanOrEqual(0)
        expect(b).toBeLessThanOrEqual(spec.bands.length)
      }
    })
  }

  test('panel density drops secondary hint rows and showSum', () => {
    const audit = crossSectionLayout(roadKerbSpec, 'audit')
    const panel = crossSectionLayout(roadKerbSpec, 'panel')
    // Hint row ≥1 (width:lanes) is audit-only; collision may still stack panel primaries.
    expect(audit.dimensions.filter((d) => d.key === 'width:lanes')).toHaveLength(1)
    expect(panel.dimensions.filter((d) => d.key === 'width:lanes')).toHaveLength(0)
    expect(panel.dimensions.length).toBeLessThan(audit.dimensions.length)

    const auditSum = crossSectionLayout(roadWidthVsLanesSpec, 'audit')
    const panelSum = crossSectionLayout(roadWidthVsLanesSpec, 'panel')
    expect(auditSum.dimensions.some((d) => d.showSum)).toBe(true)
    expect(panelSum.dimensions.every((d) => !d.showSum)).toBe(true)
  })

  test('bandContentX is cumulative', () => {
    const bands = roadWidthVsLanesSpec.bands
    expect(bandContentX(bands, 0)).toBe(0)
    expect(bandContentX(bands, 1)).toBeCloseTo(0.12 * PX_PER_M, 5)
    expect(bandContentX(bands, 2)).toBeCloseTo((0.12 + 3.0) * PX_PER_M, 5)
  })

  test('verge sidewalk Randsteine sit outside the walkable band (not in :width)', () => {
    expect(vergeSpec.kerbAt).toEqual([0, 1, 2, 3])
    // Left + right of sidewalk: body outside the sidewalk band.
    expect(kerbBodySide(vergeSpec.bands, 0)).toBe('left')
    expect(kerbBodySide(vergeSpec.bands, 1)).toBe('right')
    // Carriageway faces: body outside the motor strip.
    expect(kerbBodySide(vergeSpec.bands, 2)).toBe('left')
    expect(kerbBodySide(vergeSpec.bands, 3)).toBe('right')

    const layout = crossSectionLayout(vergeSpec, 'audit')
    expect(layout.kerbs).toHaveLength(4)
    // sidewalk:left:width spans only the sidewalk band (no kerb metres).
    const sidewalk = layout.dimensions.find((d) => d.key === 'sidewalk:left:width')!
    expect(sidewalk.total).toBeCloseTo(2.0, 5)
    expect(sidewalk.x1).toBeCloseTo(layout.bands[0]!.x, 5)
    expect(sidewalk.x2).toBeCloseTo(layout.bands[0]!.x + layout.bands[0]!.width, 5)
  })

  test('dimension labels use OSM tag form (width=7, not width=* = 7)', () => {
    const layout = crossSectionLayout(vergeSpec, 'audit')
    const width = layout.dimensions.find((d) => d.key === 'width=*')!
    expect(width.labelText).toBe('width=7')
    const sidewalk = layout.dimensions.find((d) => d.key === 'sidewalk:left:width')!
    expect(sidewalk.labelText).toBe('sidewalk:left:width=2')
  })
})

describe('edge attachment: clear vs inclusive, kerb outside', () => {
  test('clear width:lanes ticks sit on motor band edges (inner face of adjacent paint)', () => {
    const layout = crossSectionLayout(roadWidthVsLanesSpec, 'audit')
    const paint = layout.bands.filter((b) => b.kind === 'paint')
    const motors = layout.bands.filter((b) => b.kind === 'motor')
    const laneDim = layout.dimensions.find((d) => d.key === 'width:lanes')!

    expect(laneDim.measure).toBe('clear')
    expect(laneDim.pipeLabel).toBe(true)
    expect(laneDim.segments).toHaveLength(2)
    // Left motor: between paint[0] and paint[1]
    expect(laneDim.segments[0]!.x1).toBeCloseTo(motors[0]!.x, 5)
    expect(laneDim.segments[0]!.x2).toBeCloseTo(motors[0]!.x + motors[0]!.width, 5)
    expect(laneDim.segments[0]!.x1).toBeCloseTo(paint[0]!.x + paint[0]!.width, 5)
    expect(laneDim.segments[0]!.x2).toBeCloseTo(paint[1]!.x, 5)
    // Right motor
    expect(laneDim.segments[1]!.x1).toBeCloseTo(motors[1]!.x, 5)
    expect(laneDim.segments[1]!.x2).toBeCloseTo(motors[1]!.x + motors[1]!.width, 5)
  })

  test('inclusive buffer ticks span outer faces of first/last paint in the package', () => {
    const layout = crossSectionLayout(cyclewayBufferSpec, 'audit')
    const buffer = layout.dimensions.find((d) => d.key.includes('buffer'))!
    expect(buffer.measure).toBe('inclusive')
    const firstPaint = layout.bands[1]!
    const lastPaint = layout.bands[3]!
    expect(firstPaint.kind).toBe('paint')
    expect(lastPaint.kind).toBe('paint')
    expect(buffer.x1).toBeCloseTo(firstPaint.x, 5)
    expect(buffer.x2).toBeCloseTo(lastPaint.x + lastPaint.width, 5)
  })

  test('kerb body sits outside the carriageway face (tick x)', () => {
    const layout = crossSectionLayout(roadKerbSpec, 'audit')
    expect(layout.kerbs).toHaveLength(2)
    expect(layout.kerbs[0]!.body).toBe('left')
    expect(layout.kerbs[1]!.body).toBe('right')
    // Face aligns with first/last band edge
    expect(layout.kerbs[0]!.x).toBeCloseTo(layout.bands[0]!.x, 5)
    const last = layout.bands[layout.bands.length - 1]!
    expect(layout.kerbs[1]!.x).toBeCloseTo(last.x + last.width, 5)
    // width=* ticks on those faces
    const width = layout.dimensions.find((d) => d.key === 'width=*')!
    expect(width.measure).toBe('inclusive')
    expect(width.x1).toBeCloseTo(layout.kerbs[0]!.x, 5)
    expect(width.x2).toBeCloseTo(layout.kerbs[1]!.x, 5)
  })

  test('paint band width equals true metres (no stroke floor bleed)', () => {
    const layout = crossSectionLayout(roadWidthVsLanesSpec, 'audit')
    for (const band of layout.bands.filter((b) => b.kind === 'paint')) {
      expect(band.width).toBeCloseTo(band.m * PX_PER_M, 5)
    }
  })

  test('way↑: parking on diagram-left is parking:left; cycle buffer is cycleway:right:buffer:left', () => {
    const keys = roadKerbSpec.dimensions.map((d) => d.key)
    expect(keys).toContain('parking:left:width')
    expect(keys).not.toContain('parking:right:width')
    expect(keys).toContain('cycleway:right:width')
    expect(keys).toContain('cycleway:right:buffer:left')
    expect(roadKerbSpec.wayOrientation).toBe(true)
    const layout = crossSectionLayout(roadKerbSpec, 'audit')
    expect(layout.bands.find((b) => b.kind === 'motor')?.flowArrow).toBe(true)
    expect(layout.bands.find((b) => b.kind === 'cycle')?.flowArrow).toBe(true)
    expect(layout.bands.find((b) => b.kind === 'parking')?.flowArrow).toBe(false)
  })
})

describe('cross-section label boxes (no clip / no same-row overlap)', () => {
  const densities = ['audit', 'panel'] as const

  function boxesOverlap(aLeft: number, aRight: number, bLeft: number, bRight: number): boolean {
    return aLeft < bRight && bLeft < aRight
  }

  for (const spec of allCrossSectionSpecs) {
    for (const density of densities) {
      test(`${spec.id} @ ${density}: labels+sums inside viewBox and no same-row overlap`, () => {
        const layout = crossSectionLayout(spec, density)
        const { width: vbW, height: vbH } = layout.viewBox

        for (const dim of layout.dimensions) {
          expect(dim.labelLeft).toBeGreaterThanOrEqual(0)
          expect(dim.labelRight).toBeLessThanOrEqual(vbW)
          expect(dim.y).toBeGreaterThanOrEqual(0)
          expect(dim.y).toBeLessThanOrEqual(vbH)
          expect(dim.labelWidth).toBeGreaterThan(0)
          expect(dim.labelRight - dim.labelLeft).toBeCloseTo(dim.labelWidth, 5)

          if (dim.showSum) {
            expect(dim.sumText).toBeTruthy()
            expect(dim.sumRow).toBe(dim.row + 1)
            expect(dim.sumLeft).toBeGreaterThanOrEqual(0)
            expect(dim.sumRight).toBeLessThanOrEqual(vbW)
            expect(dim.sumWidth).toBeGreaterThan(0)
            expect(dim.sumRight - dim.sumLeft).toBeCloseTo(dim.sumWidth, 5)
          } else {
            expect(dim.sumText).toBeNull()
            expect(dim.sumRow).toBeNull()
          }
        }

        for (const side of ['above', 'below'] as const) {
          const dims = layout.dimensions.filter((d) => d.side === side)
          for (let i = 0; i < dims.length; i++) {
            for (let j = i + 1; j < dims.length; j++) {
              const a = dims[i]!
              const b = dims[j]!

              if (a.row === b.row) {
                expect(boxesOverlap(a.labelLeft, a.labelRight, b.labelLeft, b.labelRight)).toBe(
                  false,
                )
                // showSum widens the same-row footprint (sum sits just outside the label).
                if (a.showSum) {
                  expect(boxesOverlap(a.sumLeft, a.sumRight, b.labelLeft, b.labelRight)).toBe(false)
                }
                if (b.showSum) {
                  expect(boxesOverlap(b.sumLeft, b.sumRight, a.labelLeft, a.labelRight)).toBe(false)
                }
                if (a.showSum && b.showSum) {
                  expect(boxesOverlap(a.sumLeft, a.sumRight, b.sumLeft, b.sumRight)).toBe(false)
                }
              }

              // Sum of one dim vs label/sum of another on the reserved sum row.
              if (a.sumRow != null && a.sumRow === b.row) {
                expect(boxesOverlap(a.sumLeft, a.sumRight, b.labelLeft, b.labelRight)).toBe(false)
              }
              if (b.sumRow != null && b.sumRow === a.row) {
                expect(boxesOverlap(b.sumLeft, b.sumRight, a.labelLeft, a.labelRight)).toBe(false)
              }
              if (a.sumRow != null && a.sumRow === b.sumRow) {
                expect(boxesOverlap(a.sumLeft, a.sumRight, b.sumLeft, b.sumRight)).toBe(false)
              }
            }
          }
        }
      })
    }
  }

  test('cycleway-buffer: showSum pushes the neighbouring width label onto a free row', () => {
    const layout = crossSectionLayout(cyclewayBufferSpec, 'audit')
    const buffer = layout.dimensions.find((d) => d.key === 'cycleway:right:buffer:left')
    const width = layout.dimensions.find((d) => d.key === 'cycleway:right:width')
    expect(buffer?.showSum).toBe(true)
    expect(buffer?.sumRow).toBe((buffer?.row ?? 0) + 1)
    // Width must not share the buffer label row (sum widens that footprint) or the sum row.
    expect(width?.row).not.toBe(buffer?.row)
    expect(width?.row).not.toBe(buffer?.sumRow)
  })
})
