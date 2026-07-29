import { describe, expect, test } from 'bun:test'
import de from '../../messages/de.json'
import en from '../../messages/en.json'
import type { WidthMeasureGuideKind } from '../modes/width/domain/width-measure-guide-kind'
import { measureGuideSections } from '../modes/width/measure-guide/sections'
import { allCrossSectionSpecs } from '../modes/width/measure-guide/specs'

const GUIDE_KINDS: readonly WidthMeasureGuideKind[] = ['road', 'sidewalk', 'cycleway', 'other']

const SPEC_IDS = new Set(allCrossSectionSpecs.map((s) => s.id))

describe('measure-guide registry completeness', () => {
  test('section ids are unique', () => {
    const ids = measureGuideSections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('every section has research, panelKinds, audience, editorWrites', () => {
    for (const section of measureGuideSections) {
      expect(section.research.length).toBeGreaterThan(0)
      expect(Array.isArray(section.panelKinds)).toBe(true)
      expect(section.audience === 'panel+audit' || section.audience === 'audit').toBe(true)
      expect(section.editorWrites.length).toBeGreaterThan(0)
    }
  })

  test('every panelKinds value is a real WidthMeasureGuideKind', () => {
    for (const section of measureGuideSections) {
      for (const kind of section.panelKinds) {
        expect(GUIDE_KINDS).toContain(kind)
      }
    }
  })

  test('every non-null spec is in allCrossSectionSpecs', () => {
    for (const section of measureGuideSections) {
      if (section.spec == null) continue
      expect(SPEC_IDS.has(section.spec.id)).toBe(true)
      expect(allCrossSectionSpecs).toContain(section.spec)
    }
  })

  test('narrowings is text-only; row_composition is audit-only', () => {
    const narrowings = measureGuideSections.find((s) => s.id === 'narrowings')
    const row = measureGuideSections.find((s) => s.id === 'row_composition')
    expect(narrowings?.spec).toBeNull()
    expect(row?.audience).toBe('audit')
    expect(row?.panelKinds).toEqual([])
  })

  test('road_kerb research reaches Scenario B; double-count note is on road_kerb', () => {
    const kerb = measureGuideSections.find((s) => s.id === 'road_kerb')
    const vsLanes = measureGuideSections.find((s) => s.id === 'road_width_vs_lanes')
    expect(kerb?.research).toContain('§3.3 Scenario B')
    expect(kerb?.messages.note).toBe('width_guide_road_kerb_note')
    expect(vsLanes?.messages.note).toBeUndefined()
  })
})

describe('measure-guide message coverage', () => {
  test('en and de have identical key sets', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort())
  })

  test('every registry messages key stem exists in en and de', () => {
    for (const section of measureGuideSections) {
      for (const key of Object.values(section.messages)) {
        if (key == null) continue
        expect(en).toHaveProperty(key)
        expect(de).toHaveProperty(key)
        expect(typeof (en as Record<string, unknown>)[key]).toBe('string')
        expect(typeof (de as Record<string, unknown>)[key]).toBe('string')
      }
      for (const link of section.links) {
        expect(en).toHaveProperty(link.labelKey)
        expect(de).toHaveProperty(link.labelKey)
        expect(link.href.startsWith('https://')).toBe(true)
      }
    }
  })
})
