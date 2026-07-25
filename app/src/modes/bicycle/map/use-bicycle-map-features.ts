import type { MapBounds } from '../../parking/map/types'
import { useBicycleOsmQuery } from './bicycle-osm-query'
import {
  bicycleToCollection,
  emptyBicycleCollection,
  parseBicycleFeaturesFromData,
} from './parse-bikelanes'

export function deriveBicycleMapFeatures(
  graph: Parameters<typeof parseBicycleFeaturesFromData>[0],
  bounds: MapBounds | undefined,
) {
  if (!bounds) return emptyBicycleCollection()
  return bicycleToCollection(parseBicycleFeaturesFromData(graph, bounds))
}

export function useBicycleMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const { data } = useBicycleOsmQuery({
    select: (osmData) => deriveBicycleMapFeatures(osmData.graph, bounds),
  })

  return data ?? emptyBicycleCollection()
}
