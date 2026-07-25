import type { OsmTags } from '@osm-editor-kit/osm-data'
import type { Side } from '../../../utils/types/parking'

const surfaceShowValues = new Set([
  'lane',
  'street_side',
  'on_kerb',
  'half_on_kerb',
  'shoulder',
  'yes',
])

function parkingValueForSide(tags: OsmTags, side: Side): string | undefined {
  return tags[`parking:${side}`] ?? tags['parking:both']
}

function hasSurfaceTag(tags: OsmTags, side: Side): boolean {
  return Boolean(tags[`parking:${side}:surface`] ?? tags['parking:both:surface'])
}

/** True when editor would show surface for this side but no surface tag is set. */
export function isMissingSurfaceForSide(tags: OsmTags, side: Side): boolean {
  const parkingValue = parkingValueForSide(tags, side)
  if (!parkingValue || !surfaceShowValues.has(parkingValue)) return false
  return !hasSurfaceTag(tags, side)
}
