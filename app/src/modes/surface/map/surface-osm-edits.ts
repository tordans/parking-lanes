import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { SidepathPrefix, SidepathSide } from '@osm-editor-kit/osm-sidepath-tags'
import { nestSideTags } from '@osm-editor-kit/osm-sidepath-tags'
import type { QueryClient } from '@tanstack/react-query'
import { applyTagPatch } from '../../../components/tag-editor'
import {
  remapOsmWayIdInSession,
  updateOsmWayInSession,
} from '../../../shell/map/osm-session-way-edits'
import type { TagPatch } from '../domain/surface-tag-patches'

export { applyTagPatch }

export function updateSurfaceOsmWay(queryClient: QueryClient, way: OsmWay) {
  updateOsmWayInSession(queryClient, way)
}

export function remapSurfaceOsmWayId(
  queryClient: QueryClient,
  oldId: number,
  newId: number,
): OsmWay | null {
  return remapOsmWayIdInSession(queryClient, oldId, newId)
}

function toNestablePatch(patch: TagPatch): Record<string, string | undefined> {
  const nested: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(patch)) {
    const match = key.match(/^(?:cycleway|sidewalk):(left|right):(.+)$/)
    if (match) {
      nested[match[2]!] = value
      continue
    }
    nested[key] = value
  }
  return nested
}

export function stageSurfacePatchOnWay(way: OsmWay, patch: TagPatch): OsmWay {
  return {
    ...way,
    tags: applyTagPatch(way.tags, patch),
  }
}

export function stageSurfacePatchOnSidepath(
  way: OsmWay,
  prefix: SidepathPrefix,
  side: SidepathSide,
  patch: TagPatch,
): OsmWay {
  return {
    ...way,
    tags: nestSideTags(way.tags, prefix, side, toNestablePatch(patch)),
  }
}

export function mergeSurfacePatches(...patches: TagPatch[]): TagPatch {
  return patches.reduce<TagPatch>((merged, patch) => ({ ...merged, ...patch }), {})
}
