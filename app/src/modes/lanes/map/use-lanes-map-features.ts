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
) {
  if (!bounds) return emptyLanesCollection()
  return lanesToCollection(parseLanesFeaturesFromData(graph, bounds))
}

export function useLanesMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const { data } = useLanesOsmQuery({
    select: (osmData) => deriveLanesMapFeatures(osmData.graph, bounds),
  })

  return data ?? emptyLanesCollection()
}
