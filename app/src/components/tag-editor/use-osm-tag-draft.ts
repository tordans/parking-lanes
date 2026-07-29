import type { OsmTags, OsmWay } from '@osm-editor-kit/osm-data'
import { useEffect, useRef, useState } from 'react'
import { applyTagKeyChange, applyTagPatch, type TagCommitOptions } from './tag-draft'
import { tagEditCommitDebounceMs, useDebouncedCommit } from './use-debounced-commit'

/**
 * Single draft SoT for OSM way tags while editing.
 * Inputs bind to `draftTags` / `draftWay`; session commits are debounced unless `immediate`.
 * Switching `way.id` cancels a pending commit and resets the draft from the new way.
 */
export function useOsmTagDraft(options: {
  way: OsmWay
  onCommit: (way: OsmWay) => void
  wait?: number
}): {
  draftTags: OsmTags
  draftWay: OsmWay
  setTag: (key: string, value: string, commitOptions?: TagCommitOptions) => void
  setTags: (tags: OsmTags, commitOptions?: TagCommitOptions) => void
  patchTags: (patch: Record<string, string | undefined>, commitOptions?: TagCommitOptions) => void
  /** Replace draft tags from a fully staged way (e.g. sidepath nest helpers). */
  setWay: (way: OsmWay, commitOptions?: TagCommitOptions) => void
  flush: () => void
  cancel: () => void
} {
  const [draftTags, setDraftTags] = useState<OsmTags>(() => ({ ...options.way.tags }))
  const [trackedWayId, setTrackedWayId] = useState(options.way.id)
  const draftTagsRef = useRef(draftTags)

  const onCommitRef = useRef(options.onCommit)
  useEffect(() => {
    onCommitRef.current = options.onCommit
  }, [options.onCommit])

  const wayRef = useRef(options.way)
  useEffect(() => {
    wayRef.current = options.way
  }, [options.way])

  useEffect(() => {
    draftTagsRef.current = draftTags
  }, [draftTags])

  const { commit, flush, cancel } = useDebouncedCommit(
    (way: OsmWay) => {
      onCommitRef.current(way)
    },
    { wait: options.wait ?? tagEditCommitDebounceMs },
  )

  if (options.way.id !== trackedWayId) {
    cancel()
    setTrackedWayId(options.way.id)
    setDraftTags({ ...options.way.tags })
  }

  function publish(nextTags: OsmTags, commitOptions?: TagCommitOptions) {
    draftTagsRef.current = nextTags
    setDraftTags(nextTags)
    commit({ ...wayRef.current, tags: nextTags }, commitOptions)
  }

  return {
    draftTags,
    draftWay: { ...options.way, tags: draftTags },
    setTag(key, value, commitOptions) {
      publish(applyTagKeyChange(draftTagsRef.current, key, value), commitOptions)
    },
    setTags(tags, commitOptions) {
      publish({ ...tags }, commitOptions)
    },
    patchTags(patch, commitOptions) {
      publish(applyTagPatch(draftTagsRef.current, patch), commitOptions)
    },
    setWay(way, commitOptions) {
      publish({ ...way.tags }, commitOptions)
    },
    flush,
    cancel,
  }
}
