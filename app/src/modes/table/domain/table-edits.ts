import type { OsmWay } from '@osm-editor-kit/osm-data'
import { swapLeftRightKey } from '@osm-editor-kit/osm-way-chain'
import { getPendingWay } from '../../../utils/changes-store'

/** Map a table display key back to the raw OSM key (undo chain orientation). */
export function osmKeyFromDisplayKey(displayKey: string, reversed: boolean | undefined): string {
  return reversed ? swapLeftRightKey(displayKey) : displayKey
}

/**
 * Latest way to mutate for a table edit: pending changeset wins over session graph
 * so other modes' pending tags are not dropped from a full tag snapshot.
 */
export function resolveTableEditBaseWay(
  wayId: number,
  sessionWay: OsmWay | null | undefined,
): OsmWay | null {
  return getPendingWay(wayId) ?? sessionWay ?? null
}

/** Apply one display-key mutation onto a raw OSM way (de-orients when reversed). */
export function applyTableTagToWay(
  way: OsmWay,
  displayKey: string,
  value: string | undefined,
  reversed?: boolean,
): OsmWay {
  const key = osmKeyFromDisplayKey(displayKey, reversed)
  const tags = { ...way.tags }
  if (value === undefined || value === '') delete tags[key]
  else tags[key] = value
  return { ...way, tags }
}
