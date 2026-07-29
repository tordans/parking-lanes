import { describe, expect, test } from 'bun:test'
import {
  parseResearchDeepLinkParts,
  RESEARCH_README_URL,
  researchSectionAnchor,
  researchSectionHref,
} from '../modes/width/measure-guide/research-deeplink'
import { measureGuideSections } from '../modes/width/measure-guide/sections'

describe('research deeplinks', () => {
  test('maps §N.M to stable README anchors', () => {
    expect(researchSectionAnchor('§2.2')).toBe('sec-2-2')
    expect(researchSectionAnchor('§3.1')).toBe('sec-3-1')
    expect(researchSectionAnchor('§7.1')).toBe('sec-7-1')
    expect(researchSectionAnchor('§7')).toBe('sec-7')
    expect(researchSectionHref('§2.2')).toBe(`${RESEARCH_README_URL}#sec-2-2`)
  })

  test('parses combined research lines into linked § tokens', () => {
    const parts = parseResearchDeepLinkParts('§2.2 + §3.1/§3.2')
    expect(parts).toEqual([
      { type: 'ref', value: '§2.2', href: `${RESEARCH_README_URL}#sec-2-2` },
      { type: 'text', value: ' + ' },
      { type: 'ref', value: '§3.1', href: `${RESEARCH_README_URL}#sec-3-1` },
      { type: 'text', value: '/' },
      { type: 'ref', value: '§3.2', href: `${RESEARCH_README_URL}#sec-3-2` },
    ])
  })

  test('keeps scenario labels as text after the § token', () => {
    const parts = parseResearchDeepLinkParts('§2.1/§2.6 · §3.3 Scenario B')
    expect(parts.filter((p) => p.type === 'ref').map((p) => p.value)).toEqual([
      '§2.1',
      '§2.6',
      '§3.3',
    ])
    expect(parts.some((p) => p.type === 'text' && p.value.includes('Scenario B'))).toBe(true)
  })

  test('every measure-guide research § ref has a mapped anchor', () => {
    for (const section of measureGuideSections) {
      const refs = parseResearchDeepLinkParts(section.research).filter((p) => p.type === 'ref')
      expect(refs.length).toBeGreaterThan(0)
      for (const ref of refs) {
        expect(researchSectionAnchor(ref.value)).toMatch(/^sec-\d/)
      }
    }
  })
})
