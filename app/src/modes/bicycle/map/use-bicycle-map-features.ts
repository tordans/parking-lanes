import { useHighwayInclusionStyle } from '../../../shell/map/use-highway-inclusion-style'
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
  inclusionStyle: Parameters<typeof parseBicycleFeaturesFromData>[2],
) {
  if (!bounds) return emptyBicycleCollection()
  return bicycleToCollection(parseBicycleFeaturesFromData(graph, bounds, inclusionStyle))
}

export function useBicycleMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const inclusionStyle = useHighwayInclusionStyle()
  const { data } = useBicycleOsmQuery({
    select: (osmData) => deriveBicycleMapFeatures(osmData.graph, bounds, inclusionStyle),
  })

  return data ?? emptyBicycleCollection()
}
