import type { OsmTags, OsmWay } from '@osm-editor-kit/osm-data'
import { PRIMARY_LANE_KEYS } from '@osm-editor-kit/osm-lanes'
import type { ChangeSource } from '../../utils/changeset-message'

const TOP_LEVEL_WIDTH_TAG_KEYS = new Set(['width', 'est_width', 'source:width'])

const SIDEPATH_WIDTH_TAG_PATTERN = /^(?:source:)?(?:cycleway|sidewalk):(?:left|right):width$/

function isWidthTagKey(key: string): boolean {
  return TOP_LEVEL_WIDTH_TAG_KEYS.has(key) || SIDEPATH_WIDTH_TAG_PATTERN.test(key)
}

function isParkingTagKey(key: string): boolean {
  return key === 'parking' || key.startsWith('parking:') || key.startsWith('parking_')
}

const TOP_LEVEL_SURFACE_TAG_KEYS = new Set(['surface', 'smoothness', 'sett:length'])

const INFRA_SURFACE_SCALAR_KEYS = new Set([
  'footway:surface',
  'footway:smoothness',
  'footway:sett:length',
  'cycleway:surface',
  'cycleway:smoothness',
  'cycleway:sett:length',
])

const SIDEPATH_SURFACE_TAG_PATTERN =
  /^(?:cycleway|sidewalk|footway):(?:left|right|both):(?:surface|smoothness|sett:length)$/

function isSurfaceTagKey(key: string): boolean {
  if (TOP_LEVEL_SURFACE_TAG_KEYS.has(key)) return true
  if (INFRA_SURFACE_SCALAR_KEYS.has(key)) return true
  return SIDEPATH_SURFACE_TAG_PATTERN.test(key)
}

const BICYCLE_TOP_LEVEL_KEYS = new Set([
  'bicycle',
  'cycleway',
  'foot',
  'is_sidepath',
  'segregated',
  'traffic_sign',
  'surface',
  'smoothness',
])

const BICYCLE_TAG_PATTERN =
  /^(?:cycleway|bicycle|separation|traffic_mode|marking|buffer)(?::(?:left|right|both))?(?::|$)/

function isBicycleTagKey(key: string): boolean {
  if (BICYCLE_TOP_LEVEL_KEYS.has(key)) return true
  return BICYCLE_TAG_PATTERN.test(key)
}

function pickWidthTags(tags: OsmTags): OsmTags {
  const picked: OsmTags = {}
  for (const [key, value] of Object.entries(tags)) {
    if (value !== undefined && isWidthTagKey(key)) picked[key] = value
  }
  return picked
}

function pickSurfaceTags(tags: OsmTags): OsmTags {
  const picked: OsmTags = {}
  for (const [key, value] of Object.entries(tags)) {
    if (value !== undefined && isSurfaceTagKey(key)) picked[key] = value
  }
  return picked
}

function pickBicycleTags(tags: OsmTags): OsmTags {
  const picked: OsmTags = {}
  for (const [key, value] of Object.entries(tags)) {
    if (value !== undefined && isBicycleTagKey(key)) picked[key] = value
  }
  return picked
}

function pickLaneTags(tags: OsmTags): OsmTags {
  const picked: OsmTags = {}
  for (const [key, value] of Object.entries(tags)) {
    if (value !== undefined && PRIMARY_LANE_KEYS.has(key)) picked[key] = value
  }
  return picked
}

/** Non-parking tags from `base` so a full parking form snapshot cannot drop other modes' keys. */
function preserveNonParkingTags(tags: OsmTags): OsmTags {
  const preserved: OsmTags = {}
  for (const [key, value] of Object.entries(tags)) {
    if (!isParkingTagKey(key)) preserved[key] = value
  }
  return preserved
}

/**
 * Merge an incoming mode edit onto the latest known way (pending change or session).
 * Prevents one mode's full tag snapshot from wiping another mode's pending tags.
 */
export function mergeWayEdit(base: OsmWay, incoming: OsmWay, source: ChangeSource): OsmWay {
  if (source === 'width') {
    return {
      ...base,
      ...incoming,
      nodes: incoming.nodes ?? base.nodes,
      tags: {
        ...base.tags,
        ...pickWidthTags(incoming.tags),
      },
    }
  }

  if (source === 'surface') {
    return {
      ...base,
      ...incoming,
      nodes: incoming.nodes ?? base.nodes,
      tags: {
        ...base.tags,
        ...pickSurfaceTags(incoming.tags),
      },
    }
  }

  if (source === 'bicycle') {
    return {
      ...base,
      ...incoming,
      nodes: incoming.nodes ?? base.nodes,
      tags: {
        ...base.tags,
        ...pickBicycleTags(incoming.tags),
      },
    }
  }

  if (source === 'lanes') {
    return {
      ...base,
      ...incoming,
      nodes: incoming.nodes ?? base.nodes,
      tags: {
        ...base.tags,
        ...pickLaneTags(incoming.tags),
      },
    }
  }

  if (source === 'table') {
    // Full tag snapshot so clears/deletes stick (unlike patch-merge modes).
    return {
      ...base,
      ...incoming,
      nodes: incoming.nodes ?? base.nodes,
      tags: { ...incoming.tags },
    }
  }

  if (source === 'parking') {
    return {
      ...base,
      ...incoming,
      nodes: incoming.nodes ?? base.nodes,
      tags: {
        ...preserveNonParkingTags(base.tags),
        ...incoming.tags,
      },
    }
  }

  return {
    ...base,
    ...incoming,
    nodes: incoming.nodes ?? base.nodes,
    tags: {
      ...base.tags,
      ...incoming.tags,
    },
  }
}
