import { describe, expect, test } from 'bun:test'
import {
  formatWidthTag,
  roundWidthMetres,
  SOURCE_WIDTH_FALLBACK,
  sourceWidthFromImagery,
  stageWidthOnSidepath,
  stageWidthOnWay,
} from '../modes/width/map/width-osm-edits'
import { setCurrentBackgroundLayerId } from '../shell/map/imagery-usage-session'

describe('roundWidthMetres', () => {
  test('rounds to 10 cm', () => {
    expect(roundWidthMetres(5.24)).toBe(5.2)
    expect(roundWidthMetres(5.25)).toBe(5.3)
    expect(roundWidthMetres(5)).toBe(5)
    expect(roundWidthMetres(5.01)).toBe(5)
  })
})

describe('formatWidthTag', () => {
  test('writes at most one decimal place', () => {
    expect(formatWidthTag(5.24)).toBe('5.2')
    expect(formatWidthTag(5)).toBe('5')
    expect(formatWidthTag(5.0)).toBe('5')
  })
})

describe('source:width from aerial imagery', () => {
  test('uses active ELI background id', () => {
    setCurrentBackgroundLayerId('Berlin-Alkis')
    expect(sourceWidthFromImagery()).toBe('Berlin-Alkis')

    const way = stageWidthOnWay(
      {
        id: 1,
        type: 'way',
        version: 1,
        changeset: 1,
        nodes: [1, 2],
        tags: { highway: 'residential' },
      },
      6.2,
    )
    expect(way.tags['source:width']).toBe('Berlin-Alkis')
    expect(way.tags.width).toBe('6.2')

    const sidepath = stageWidthOnSidepath(
      {
        id: 2,
        type: 'way',
        version: 1,
        changeset: 1,
        nodes: [1, 2],
        tags: { highway: 'residential', 'cycleway:left': 'track' },
      },
      'cycleway',
      'left',
      2,
    )
    expect(sidepath.tags['source:cycleway:left:width']).toBe('Berlin-Alkis')
  })

  test('falls back when no aerial background is selected', () => {
    setCurrentBackgroundLayerId(null)
    expect(sourceWidthFromImagery()).toBe(SOURCE_WIDTH_FALLBACK)
  })
})
