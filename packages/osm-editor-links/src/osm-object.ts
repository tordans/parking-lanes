import { osmProdUrl } from './hosts'
import type { OsmObjectType } from './osm-type'

export type OsmTypeId = {
  osmType: OsmObjectType | null | undefined
  osmId: number | string | null | undefined
}

/** `https://www.openstreetmap.org/{type}/{id}` */
export function osmOrgUrl({ osmType, osmId }: OsmTypeId): string | undefined {
  if (!osmType || osmId == null || osmId === '') return undefined
  return `${osmProdUrl}/${osmType}/${osmId}`
}

/** OSM website object history page. */
export function osmObjectHistoryUrl({ osmType, osmId }: OsmTypeId): string | undefined {
  if (!osmType || osmId == null || osmId === '') return undefined
  return `${osmProdUrl}/${osmType}/${osmId}/history`
}

/** `https://www.openstreetmap.org/changeset/{id}` */
export function osmChangesetUrl(changesetId: number | string): string {
  return `${osmProdUrl}/changeset/${changesetId}`
}
