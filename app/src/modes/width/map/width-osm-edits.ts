import type { OsmWay } from '@osm-editor-kit/osm-data'
import type { SidepathPrefix, SidepathSide } from '@osm-editor-kit/osm-sidepath-tags'
import { nestSideTags } from '@osm-editor-kit/osm-sidepath-tags'
import type { QueryClient } from '@tanstack/react-query'
import { getCurrentBackgroundLayerId } from '../../../shell/map/imagery-usage-session'
import {
  remapOsmWayIdInSession,
  updateOsmWayInSession,
} from '../../../shell/map/osm-session-way-edits'

/** Fallback when no aerial/ELI background is selected (`?bg=` omitted). */
export const SOURCE_WIDTH_FALLBACK = 'street-space-editor'

export function updateWidthOsmWay(queryClient: QueryClient, way: OsmWay) {
  updateOsmWayInSession(queryClient, way)
}

export function remapWidthOsmWayId(
  queryClient: QueryClient,
  oldId: number,
  newId: number,
): OsmWay | null {
  return remapOsmWayIdInSession(queryClient, oldId, newId)
}

/** Round edited widths to 10 cm. Do not use when only displaying an existing OSM value. */
export function roundWidthMetres(widthM: number): number {
  return Math.round(widthM * 10) / 10
}

export function formatWidthTag(widthM: number): string {
  const rounded = roundWidthMetres(widthM)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Provenance for edited widths: active aerial imagery ELI id when set. */
export function sourceWidthFromImagery(): string {
  return getCurrentBackgroundLayerId() ?? SOURCE_WIDTH_FALLBACK
}

export function stageWidthOnWay(way: OsmWay, widthM: number): OsmWay {
  return {
    ...way,
    tags: {
      ...way.tags,
      width: formatWidthTag(widthM),
      'source:width': sourceWidthFromImagery(),
    },
  }
}

export function stageWidthOnSidepath(
  way: OsmWay,
  prefix: SidepathPrefix,
  side: SidepathSide,
  widthM: number,
): OsmWay {
  return {
    ...way,
    tags: nestSideTags(way.tags, prefix, side, {
      width: formatWidthTag(widthM),
      'source:width': sourceWidthFromImagery(),
    }),
  }
}
