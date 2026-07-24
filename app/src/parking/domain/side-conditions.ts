import { type ParkingConditions } from '../../utils/types/conditions'
import { type OsmTags } from '../../utils/types/osm-data'
import { getConditions as getAccessConditions } from './access-condition'
import { getLaneSchemeConditions } from './lane-scheme-conditions'

export function getSideConditions(side: 'left' | 'right', tags: OsmTags): ParkingConditions {
  const conditions = getAccessConditions(tags, side)
  if (conditions.default) return conditions

  return getLaneSchemeConditions(side, tags)
}
