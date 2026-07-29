import type { SeparatelyMappedSidepath } from '@osm-editor-kit/osm-lane-diagram'
import { useLanesOsmQuery } from '../map/lanes-osm-query'
import { findSeparatelyMappedSidepath } from './find-separately-mapped-sidepath'

export type SeparatelyMappedSidepathKey =
  `${SeparatelyMappedSidepath['prefix']}:${SeparatelyMappedSidepath['side']}`

export function separatelyMappedSidepathKey(
  hint: SeparatelyMappedSidepath,
): SeparatelyMappedSidepathKey {
  return `${hint.prefix}:${hint.side}`
}

/**
 * Resolve nearest separately mapped sidepath way ids for diagram notes.
 * Missing / unresolved hints map to `null`.
 */
export function useSeparatelyMappedSidepathTargets(
  centerWayId: number | undefined,
  hints: SeparatelyMappedSidepath[],
): Record<SeparatelyMappedSidepathKey, number | null> {
  const { data: graph } = useLanesOsmQuery({ select: (data) => data.graph })

  const out: Record<SeparatelyMappedSidepathKey, number | null> = {} as Record<
    SeparatelyMappedSidepathKey,
    number | null
  >

  for (const hint of hints) {
    const key = separatelyMappedSidepathKey(hint)
    if (centerWayId == null || !graph) {
      out[key] = null
      continue
    }
    out[key] = findSeparatelyMappedSidepath(graph, centerWayId, hint)?.wayId ?? null
  }

  return out
}
