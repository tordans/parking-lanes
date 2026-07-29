import { expandSidepaths, type SidepathPrefix } from '@osm-editor-kit/osm-sidepath-tags'

export type SidepathPresenceSchema = 'none' | 'unsided' | 'both' | 'sided'

export type SidepathPresence = {
  prefix: SidepathPrefix
  /** Key currently in use for writes (empty string when unknown). */
  writeKey: string
  /** Value for a single control when schema is unsided/both; empty when sided/none. */
  value: string
  left?: string
  right?: string
  schema: SidepathPresenceSchema
  /** True when no sided or unsided presence tag exists for this prefix. */
  isUnknown: boolean
}

/**
 * Derive sidewalk/cycleway presence from unsided, `:both`, and sided keys.
 * Uses `expandSidepaths` so left/right virtuals stay consistent with the matrix.
 */
export function resolveSidepathPresence(
  tags: Record<string, string>,
  prefix: SidepathPrefix,
): SidepathPresence {
  const unsided = tags[prefix]
  const bothKey = `${prefix}:both`
  const both = tags[bothKey]
  const leftKey = `${prefix}:left`
  const rightKey = `${prefix}:right`
  const left = tags[leftKey]
  const right = tags[rightKey]

  const expanded = expandSidepaths(0, tags).filter((entry) => entry.ref.prefix === prefix)
  const expandedLeft = expanded.find((entry) => entry.ref.side === 'left')
  const expandedRight = expanded.find((entry) => entry.ref.side === 'right')

  if (unsided != null) {
    return {
      prefix,
      writeKey: prefix,
      value: unsided,
      left: expandedLeft ? (left ?? unsided) : undefined,
      right: expandedRight ? (right ?? unsided) : undefined,
      schema: 'unsided',
      isUnknown: false,
    }
  }

  if (both != null) {
    return {
      prefix,
      writeKey: bothKey,
      value: both,
      left: both,
      right: both,
      schema: 'both',
      isUnknown: false,
    }
  }

  if (left != null || right != null) {
    return {
      prefix,
      writeKey:
        left != null && right == null ? leftKey : right != null && left == null ? rightKey : '',
      value: '',
      left,
      right,
      schema: 'sided',
      isUnknown: false,
    }
  }

  return {
    prefix,
    writeKey: prefix,
    value: '',
    left: undefined,
    right: undefined,
    schema: 'none',
    isUnknown: expanded.length === 0,
  }
}

/** OSM values commonly used on bare / `:both` sidewalk presence. */
export const SIDEWALK_PRESENCE_VALUES = ['yes', 'no', 'left', 'right', 'both', 'separate'] as const

/** OSM values commonly used on sided `sidewalk:left|right`. */
export const SIDEWALK_SIDE_VALUES = ['yes', 'no', 'separate'] as const

/** Common cycleway infrastructure values (bare, `:both`, or sided). */
export const CYCLEWAY_PRESENCE_VALUES = [
  'no',
  'lane',
  'track',
  'share_busway',
  'shared_lane',
  'separate',
  'opposite',
  'opposite_lane',
  'opposite_track',
  'crossing',
  'shoulder',
] as const

export const ONEWAY_VALUES = ['yes', 'no', '-1'] as const
export const YES_NO_VALUES = ['yes', 'no'] as const
