import { describe, expect, test } from 'bun:test'
import {
  classifySettSize,
  deriveSmoothness,
  normalizeTaggedSmoothness,
  sanitizeSurface,
  settLengthForSize,
  settSizeFromLength,
  suggestSmoothnessFromSurface,
  suggestSurfaceFromParent,
} from '../index'

describe('sanitizeSurface', () => {
  test('maps known transformations', () => {
    expect(sanitizeSurface({ surface: 'earth' })).toBe('ground')
    expect(sanitizeSurface({ surface: 'cobblestone' })).toBe('large_sett')
    expect(sanitizeSurface({ surface: 'tartan' })).toBe('rubber')
  })

  test('classifies sett by length thresholds', () => {
    expect(sanitizeSurface({ surface: 'sett', 'sett:length': '0.07' })).toBe('mosaic_sett')
    expect(sanitizeSurface({ surface: 'sett', 'sett:length': '0.08' })).toBe('mosaic_sett')
    expect(sanitizeSurface({ surface: 'sett', 'sett:length': '0.12' })).toBe('small_sett')
    expect(sanitizeSurface({ surface: 'sett', 'sett:length': '0.13' })).toBe('small_sett')
    expect(sanitizeSurface({ surface: 'sett', 'sett:length': '0.14' })).toBe('large_sett')
  })

  test('returns undefined for ignored seasonal surfaces', () => {
    expect(sanitizeSurface({ surface: 'ice' })).toBeUndefined()
  })
})

describe('classifySettSize', () => {
  test('uses tilda thresholds', () => {
    expect(classifySettSize(0.05)).toBe('mosaic_sett')
    expect(classifySettSize(0.08)).toBe('mosaic_sett')
    expect(classifySettSize(0.1)).toBe('small_sett')
    expect(classifySettSize(0.13)).toBe('small_sett')
    expect(classifySettSize(0.2)).toBe('large_sett')
  })
})

describe('sett size helpers', () => {
  test('round-trips default lengths', () => {
    expect(settSizeFromLength(0.08)).toBe('mosaic_sett')
    expect(settLengthForSize('mosaic_sett')).toBe(0.08)
    expect(settLengthForSize('small_sett')).toBe(0.13)
    expect(settLengthForSize('large_sett')).toBe(0.15)
  })
})

describe('deriveSmoothness', () => {
  test('prefers direct smoothness tag', () => {
    expect(deriveSmoothness({ smoothness: 'good' })).toEqual({
      smoothness: 'good',
      smoothness_source: 'tag',
      smoothness_confidence: 'high',
    })
  })

  test('normalizes legacy smoothness values', () => {
    expect(deriveSmoothness({ smoothness: 'horrible' })).toEqual({
      smoothness: 'very_bad',
      smoothness_source: 'tag_normalized',
      smoothness_confidence: 'high',
    })
  })

  test('falls back surface → tracktype → mtb:scale', () => {
    expect(deriveSmoothness({ surface: 'asphalt' }).smoothness_source).toBe('surface_to_smoothness')
    expect(deriveSmoothness({ tracktype: 'grade1' }).smoothness_source).toBe(
      'tracktype_to_smoothness',
    )
    expect(deriveSmoothness({ 'mtb:scale': '0' }).smoothness).toBe('bad')
    expect(deriveSmoothness({ 'mtb:scale': '2' }).smoothness).toBe('very_bad')
  })
})

describe('normalizeTaggedSmoothness', () => {
  test('returns undefined without a tag', () => {
    expect(normalizeTaggedSmoothness({ surface: 'asphalt' })).toBeUndefined()
  })

  test('normalizes tagged values only', () => {
    expect(normalizeTaggedSmoothness({ smoothness: 'horrible' })).toBe('very_bad')
  })
})

describe('suggestions', () => {
  test('suggestSmoothnessFromSurface uses surface table', () => {
    expect(suggestSmoothnessFromSurface('asphalt')).toBe('good')
    expect(suggestSmoothnessFromSurface('sett')).toBe('bad')
  })

  test('suggestSurfaceFromParent returns OSM-safe values', () => {
    expect(suggestSurfaceFromParent({ surface: 'asphalt' })).toEqual({ surface: 'asphalt' })
    expect(suggestSurfaceFromParent({ surface: 'cobblestone' })).toEqual({
      surface: 'sett',
      settLength: 0.15,
    })
    expect(suggestSurfaceFromParent({ surface: 'sett', 'sett:length': '0.08' })).toEqual({
      surface: 'sett',
      settLength: 0.08,
    })
    expect(suggestSurfaceFromParent({ surface: 'earth' })).toEqual({ surface: 'ground' })
    expect(suggestSurfaceFromParent({})).toBeUndefined()
  })
})
