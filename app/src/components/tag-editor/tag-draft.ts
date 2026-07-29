import type { OsmTags } from '@osm-editor-kit/osm-data'

/** Set or clear a single OSM tag key. Does not mutate `tags`. */
export function applyTagKeyChange(tags: OsmTags, key: string, value: string): OsmTags {
  const nextTags = { ...tags }
  if (value) nextTags[key] = value
  else
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete nextTags[key]
  return nextTags
}

/** Apply a multi-key patch (`undefined` deletes). Does not mutate `tags`. */
export function applyTagPatch(tags: OsmTags, patch: Record<string, string | undefined>): OsmTags {
  const nextTags = { ...tags }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete nextTags[key]
    } else {
      nextTags[key] = value
    }
  }
  return nextTags
}

export type TagCommitOptions = {
  /** Skip debounce and push to session/map immediately (selects, buttons, migrations). */
  immediate?: boolean
}
