/** Port of topics/helper/derive_smoothness.lua */
import type { OsmTags } from './types.ts'

export interface SmoothnessResult {
  smoothness?: string
  smoothness_source?: string
  smoothness_confidence?: string
}

const SMOOTHNESS_DIRECT = new Set(['excellent', 'good', 'intermediate', 'bad', 'very_bad'])
const SMOOTHNESS_NORMALIZATION: Record<string, string> = {
  very_good: 'excellent',
  impassable: 'very_bad',
  horrible: 'very_bad',
  very_horrible: 'very_bad',
}

export const SURFACE_TO_SMOOTHNESS: Record<string, string> = {
  'cobblestone:flattened': 'bad',
  'concrete:lanes': 'intermediate',
  'concrete:plates': 'intermediate',
  'stone:plates': 'intermediate',
  asphalt: 'good',
  brick: 'bad',
  cobblestone: 'very_bad',
  compacted: 'intermediate',
  concrete: 'intermediate',
  dirt: 'bad',
  earth: 'bad',
  fine_gravel: 'intermediate',
  granite: 'intermediate',
  grass_paver: 'bad',
  grass: 'bad',
  gravel: 'bad',
  'gravel:lanes': 'bad',
  ground: 'bad',
  metal_grid: 'bad',
  metal: 'good',
  mud: 'very_bad',
  paved: 'intermediate',
  paving_stones: 'intermediate',
  pebblestone: 'very_bad',
  rock: 'very_bad',
  rubber: 'good',
  sand: 'very_bad',
  sett: 'bad',
  stepping_stones: 'bad',
  stone: 'bad',
  tartan: 'good',
  unhewn_cobblestone: 'very_bad',
  unpaved: 'bad',
  wood: 'intermediate',
  woodchips: 'very_bad',
}

const SURFACE_TO_SMOOTHNESS_NON_STANDARD: Record<string, string> = {
  ':plates': 'intermediate',
  'asphalt;compacted': 'intermediate',
  'asphalt;paving_stones': 'intermediate',
  sandstone: 'intermediate',
  'asphalt:lanes': 'intermediate',
  'asphalt|sett': 'very_bad',
  'cobblestone;ground': 'bad',
  'cobblestone;asphalt': 'bad',
  'compacted;paving_s': 'bad',
  'compacted;paving_stones': 'intermediate',
  'dirt;grass': 'bad',
  'dirt/sand': 'very_bad',
  'dirt;sand': 'very_bad',
  '3': 'bad',
  'grass;gravel': 'bad',
  'ground;grass': 'bad',
  'grass;ground': 'bad',
  'gravel:tracks': 'bad',
  'gravel;grass': 'bad',
  'fine_gravel;grass': 'bad',
  'fine_gravel;ground': 'bad',
  'gravel;ground': 'bad',
  'gravel; grass': 'bad',
  clay: 'bad',
  'paving_s;sett': 'bad',
  'paving_stones;asphalt': 'intermediate',
  'paving_stones;sett': 'bad',
  'paving_stones:30': 'intermediate',
  'sett;paving_s': 'bad',
  'sett;paving_stones;cobblestone:flattened': 'bad',
  'sett;paving_stones': 'bad',
  grass_unpaved: 'bad',
  grund: 'bad',
  macadam: 'intermediate',
  paving_stonees: 'intermediate',
  tiles: 'bad',
}

function normalizeSmoothness(smoothness: string | undefined): SmoothnessResult {
  if (smoothness != null) {
    if (SMOOTHNESS_DIRECT.has(smoothness)) {
      return { smoothness, smoothness_source: 'tag', smoothness_confidence: 'high' }
    }
    const normalized = SMOOTHNESS_NORMALIZATION[smoothness]
    if (normalized) {
      return {
        smoothness: normalized,
        smoothness_source: 'tag_normalized',
        smoothness_confidence: 'high',
      }
    }
  }
  return {}
}

function deriveSmoothnessFromSurface(surface: string | undefined): SmoothnessResult {
  if (!surface) return {}
  const smoothness = SURFACE_TO_SMOOTHNESS[surface] ?? SURFACE_TO_SMOOTHNESS_NON_STANDARD[surface]
  if (smoothness) {
    return {
      smoothness,
      smoothness_source: 'surface_to_smoothness',
      smoothness_confidence: 'medium',
    }
  }
  return {}
}

const TRACKTYPE_TO_SMOOTHNESS: Record<string, string> = {
  grade1: 'good',
  grade2: 'intermediate',
  grade3: 'bad',
  grade4: 'bad',
  grade5: 'very_bad',
}

function deriveSmoothnessFromTrackType(type: string | undefined): SmoothnessResult {
  if (!type) return {}
  const smoothness = TRACKTYPE_TO_SMOOTHNESS[type]
  if (smoothness) {
    return {
      smoothness,
      smoothness_source: 'tracktype_to_smoothness',
      smoothness_confidence: 'medium',
    }
  }
  return {}
}

function deriveSmoothnessFromMtbScale(scale: string | undefined): SmoothnessResult {
  if (!scale) return {}
  if (scale === '0' || scale === '0+' || scale === '0-') {
    return {
      smoothness: 'bad',
      smoothness_source: 'mtb:scale_to_smoothness',
      smoothness_confidence: 'medium',
    }
  }
  return {
    smoothness: 'very_bad',
    smoothness_source: 'mtb:scale_to_smoothness',
    smoothness_confidence: 'medium',
  }
}

export function deriveSmoothness(tags: OsmTags): SmoothnessResult {
  let result = normalizeSmoothness(tags.smoothness)
  if (result.smoothness == null) result = deriveSmoothnessFromSurface(tags.surface)
  if (result.smoothness == null) result = deriveSmoothnessFromTrackType(tags.tracktype)
  if (result.smoothness == null) result = deriveSmoothnessFromMtbScale(tags['mtb:scale'])
  return result
}

/** Normalize a tagged smoothness value for map paint (does not use derived fallbacks). */
export function normalizeTaggedSmoothness(tags: OsmTags): string | undefined {
  if (tags.smoothness == null) return undefined
  const result = normalizeSmoothness(tags.smoothness)
  return result.smoothness
}

export function suggestSmoothnessFromSurface(surface: string | undefined): string | undefined {
  return deriveSmoothnessFromSurface(surface).smoothness
}
