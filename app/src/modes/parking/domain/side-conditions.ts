import { type OsmTags } from '@osm-editor-kit/osm-data'
import { type ParkingConditions } from '../../../utils/types/conditions'
import { getConditions as getAccessConditions } from './access-condition'
import { getLaneSchemeConditions } from './lane-scheme-conditions'

export function getSideConditions(
  side: 'left' | 'right' | 'both',
  tags: OsmTags,
): ParkingConditions {
  const conditions = getAccessConditions(tags, side)
  if (conditions.default) return conditions

  return getLaneSchemeConditions(side, tags)
}
