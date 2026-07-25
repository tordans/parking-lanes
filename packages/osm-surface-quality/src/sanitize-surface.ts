import { parseLength } from './helpers/parse-length.ts'
import { sanitizeForLogging } from './helpers/sanitize-for-logging.ts'
/** Port of topics/helper/sanitize_tags.lua > `surface` */
import type { OsmTags } from './types.ts'
import { DISALLOWED } from './types.ts'

const SURFACE_ALLOWED = [
  'asphalt',
  'paved',
  'unpaved',
  'concrete',
  'concrete:plates',
  'concrete:lanes',
  'paving_stones',
  'paving_stones:lanes',
  'sett',
  'bricks',
  'stone',
  'ground',
  'grass',
  'sand',
  'compacted',
  'fine_gravel',
  'gravel',
  'pebblestone',
  'wood',
  'woodchips',
  'metal',
  'metal_grid',
  'plastic',
  'rubber',
  'grass_paver',
] as const
const SURFACE_IGNORED = ['ice', 'snow', 'salt'] as const

export type SettSize = 'mosaic_sett' | 'small_sett' | 'large_sett'

const SETT_LENGTH_BY_SIZE: Record<SettSize, number> = {
  mosaic_sett: 0.08,
  small_sett: 0.13,
  large_sett: 0.15,
}

/** Returns sanitized surface, the DISALLOWED sentinel, or undefined. */
export function isAllowedOsmSurface(surface: string): boolean {
  return (SURFACE_ALLOWED as readonly string[]).includes(surface)
}

const SETT_FAMILY: readonly SettSize[] = ['mosaic_sett', 'small_sett', 'large_sett']

export function isSettFamilySurface(surface: string): surface is SettSize {
  return (SETT_FAMILY as readonly string[]).includes(surface)
}

export function sanitizeSurface(tags: OsmTags): string | undefined {
  if (tags.surface == null) return undefined
  const transformations: Record<string, string> = {
    earth: 'ground',
    mud: 'ground',
    clay: 'ground',
    dirt: 'ground',
    'dirt/sand': 'ground',
    cobblestone: 'large_sett',
    unhewn_cobblestone: 'large_sett',
    'cobblestone:flattened': 'large_sett',
    rock: 'stone',
    'stone:plates': 'stone',
    'paving_stones:20': 'paving_stones',
    'paving_stones:30': 'paving_stones',
    tartan: 'rubber',
  }
  if (transformations[tags.surface]) return transformations[tags.surface]

  if (tags.surface === 'sett') {
    const size = parseLength(tags['sett:length'])
    if (size != null && size <= 0.08) return 'mosaic_sett'
    if (size != null && size <= 0.13) return 'small_sett'
    if (size != null && size > 0.13) return 'large_sett'
  }

  return sanitizeForLogging(tags.surface, SURFACE_ALLOWED, SURFACE_IGNORED)
}

export function classifySettSize(settLengthMetres: number): SettSize {
  if (settLengthMetres <= 0.08) return 'mosaic_sett'
  if (settLengthMetres <= 0.13) return 'small_sett'
  return 'large_sett'
}

export function settSizeFromLength(settLengthMetres: number | undefined): SettSize | undefined {
  if (settLengthMetres == null) return undefined
  return classifySettSize(settLengthMetres)
}

export function settLengthForSize(size: SettSize): number {
  return SETT_LENGTH_BY_SIZE[size]
}

export { DISALLOWED }
