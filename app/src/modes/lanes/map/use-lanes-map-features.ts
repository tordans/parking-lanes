import { useHighwayInclusionStyle } from '../../../shell/map/use-highway-inclusion-style'
import type { MapBounds } from '../../parking/map/types'
import { useLanesOsmQuery } from './lanes-osm-query'
import {
  emptyLanesCollection,
  lanesToCollection,
  parseLanesFeaturesFromData,
} from './parse-highways'

export function deriveLanesMapFeatures(
  graph: Parameters<typeof parseLanesFeaturesFromData>[0],
  bounds: MapBounds | undefined,
  inclusionStyle: Parameters<typeof parseLanesFeaturesFromData>[2],
) {
  if (!bounds) return emptyLanesCollection()
  return lanesToCollection(parseLanesFeaturesFromData(graph, bounds, inclusionStyle))
}

export function useLanesMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const inclusionStyle = useHighwayInclusionStyle()
  const { data } = useLanesOsmQuery({
    select: (osmData) => deriveLanesMapFeatures(osmData.graph, bounds, inclusionStyle),
  })

  return data ?? emptyLanesCollection()
}
