import type { MapBounds } from '../../parking/map/types'
import {
  emptyHighwayCollection,
  highwaysToCollection,
  parseHighwayFeaturesFromData,
} from './parse-highways'
import { useWidthOsmQuery } from './width-osm-query'

export function deriveWidthMapFeatures(
  graph: Parameters<typeof parseHighwayFeaturesFromData>[0],
  bounds: MapBounds | undefined,
) {
  if (!bounds) return emptyHighwayCollection()
  return highwaysToCollection(parseHighwayFeaturesFromData(graph, bounds))
}

export function useWidthMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const { data } = useWidthOsmQuery({
    select: (osmData) => deriveWidthMapFeatures(osmData.graph, bounds),
  })

  return data ?? emptyHighwayCollection()
}
