import { osmchaBase } from './hosts'

/** Single OSMCha changeset page. */
export function osmchaChangesetUrl(changesetId: number | string): string {
  return `${osmchaBase}/changesets/${changesetId}`
}

export type OsmchaFilterValue = {
  label: string
  value: string
}

/**
 * OSMCha frontend filter keys (subset). Each value is an array of `{label,value}`
 * as required by https://github.com/OSMCha/osmcha-frontend deep links.
 */
export type OsmchaFiltersInput = {
  in_bbox?: string | OsmchaFilterValue[]
  date__gte?: string | OsmchaFilterValue[]
  date__lte?: string | OsmchaFilterValue[]
  users?: string | OsmchaFilterValue[]
  uids?: string | OsmchaFilterValue[]
  ids?: string | OsmchaFilterValue[]
  tag_changes?: string | OsmchaFilterValue[]
  all_tag_changes?: string | OsmchaFilterValue[]
  comment?: string | OsmchaFilterValue[]
  metadata?: string | OsmchaFilterValue[]
  area_lt?: string | OsmchaFilterValue[]
  [key: string]: string | OsmchaFilterValue[] | undefined
}

function toFilterEntries(value: string | OsmchaFilterValue[]): OsmchaFilterValue[] {
  if (typeof value === 'string') {
    return [{ label: value, value }]
  }
  return value
}

/** Build `https://osmcha.org/?filters=<JSON>` deep link. */
export function osmchaFiltersUrl(filters: OsmchaFiltersInput): string {
  const encoded: Record<string, OsmchaFilterValue[]> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value == null) continue
    encoded[key] = toFilterEntries(value)
  }
  const json = JSON.stringify(encoded)
  return `${osmchaBase}/?filters=${encodeURIComponent(json)}`
}
