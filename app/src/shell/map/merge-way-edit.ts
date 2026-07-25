import type { OsmTags, OsmWay } from '@osm-editor-kit/osm-data'
import type { ChangeSource } from '../../utils/changeset-message'

const WIDTH_TAG_KEYS = new Set(['width', 'est_width', 'source:width'])

function isParkingTagKey(key: string): boolean {
  return key === 'parking' || key.startsWith('parking:') || key.startsWith('parking_')
}

function pickWidthTags(tags: OsmTags): OsmTags {
  const picked: OsmTags = {}
  for (const key of WIDTH_TAG_KEYS) {
    const value = tags[key]
    if (value !== undefined) picked[key] = value
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
