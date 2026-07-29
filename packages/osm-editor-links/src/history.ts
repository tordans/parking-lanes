import { osmDeepHistoryBase } from './hosts'
import type { OsmObjectType } from './osm-type'

/** OSM Deep History viewer (TILDA “Änderungshistorie”). */
export function osmDeepHistoryUrl(options: {
  osmType: OsmObjectType | null | undefined
  osmId: number | string | null | undefined
}): string | undefined {
  const { osmType, osmId } = options
  if (!osmType || osmId == null || osmId === '') return undefined
  return `${osmDeepHistoryBase}/#/${osmType}/${osmId}`
}
