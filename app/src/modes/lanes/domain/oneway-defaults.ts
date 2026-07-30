import { isOneway } from '@osm-editor-kit/osm-lanes'
import type { YesNoValue } from '../../../components/tag-editor'

/**
 * OSM-implied `oneway` when the tag is unset.
 * Roundabouts are one-way even without an explicit `oneway=yes`.
 * Otherwise the default is two-way (`no`).
 */
export function resolveImpliedOneway(tags: { oneway?: string; junction?: string }): YesNoValue {
  if (tags.junction?.toLowerCase() === 'roundabout') return 'yes'
  return 'no'
}

/**
 * OSM-implied `oneway:bicycle` when unset: inherits the effective `oneway` rule
 * (wiki: Key:oneway:bicycle).
 */
export function resolveImpliedOnewayBicycle(tags: Record<string, string>): YesNoValue {
  return isOneway(tags) ? 'yes' : 'no'
}
