import {
  BIKELANE_TRANSFORMATIONS,
  getTransformedObjects,
  prepareTags,
} from '@tilda-geo/bicycle-infrastructure'

export type SidepathPrefix = 'cycleway' | 'sidewalk'
export type SidepathSide = 'left' | 'right'

export type SidepathRef = {
  osmType: 'way'
  osmId: number
  prefix: SidepathPrefix
  side: SidepathSide
}

const SIDEPATH_PREFIXES = new Set<SidepathPrefix>(['cycleway', 'sidewalk'])
const SIDEPATH_SIDES = new Set<SidepathSide>(['left', 'right'])

function stripInternalTags(tags: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(tags)) {
    if (key.startsWith('_') || value === undefined) continue
    result[key] = value
  }
  return result
}

export function expandSidepaths(
  osmId: number,
  tags: Record<string, string>,
): Array<{ ref: SidepathRef; tags: Record<string, string> }> {
  const prepared: Record<string, string> = { ...tags }
  prepareTags(prepared)

  const transformed = getTransformedObjects(prepared, BIKELANE_TRANSFORMATIONS)
  const results: Array<{ ref: SidepathRef; tags: Record<string, string> }> = []

  for (const object of transformed) {
    const side = object._side
    const prefix = object._prefix
    if (side !== 'left' && side !== 'right') continue
    if (prefix !== 'cycleway' && prefix !== 'sidewalk') continue

    results.push({
      ref: {
        osmType: 'way',
        osmId,
        prefix,
        side,
      },
      tags: stripInternalTags(object),
    })
  }

  return results
}

export function nestSideTags(
  parentTags: Record<string, string>,
  prefix: SidepathPrefix,
  side: SidepathSide,
  patch: Record<string, string | undefined>,
): Record<string, string> {
  const result = { ...parentTags }

  for (const [key, value] of Object.entries(patch)) {
    let nestedKey: string
    if (key === 'width') {
      nestedKey = `${prefix}:${side}:width`
    } else if (key === 'source:width') {
      nestedKey = `source:${prefix}:${side}:width`
    } else if (key === 'note') {
      nestedKey = `note:${prefix}:${side}`
    } else if (key === prefix) {
      nestedKey = `${prefix}:${side}`
    } else {
      nestedKey = `${prefix}:${side}:${key}`
    }

    if (value === undefined) {
      delete result[nestedKey]
    } else {
      result[nestedKey] = value
    }
  }

  return result
}

export function formatSidepathFeatureId(ref: SidepathRef): string {
  return `way/${ref.osmId}/${ref.prefix}/${ref.side}`
}

export function parseSidepathFeatureId(id: string): SidepathRef | null {
  const parts = id.split('/')
  if (parts.length !== 4) return null
  if (parts[0] !== 'way') return null

  const osmId = Number.parseInt(parts[1]!, 10)
  if (!Number.isInteger(osmId) || osmId <= 0) return null

  const prefix = parts[2]
  const side = parts[3]
  if (!SIDEPATH_PREFIXES.has(prefix as SidepathPrefix)) return null
  if (!SIDEPATH_SIDES.has(side as SidepathSide)) return null

  return {
    osmType: 'way',
    osmId,
    prefix: prefix as SidepathPrefix,
    side: side as SidepathSide,
  }
}
