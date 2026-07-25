import type { MapBounds } from '../../parking/map/types'
import {
  emptySurfaceCollection,
  parseSurfaceFeaturesFromData,
  surfacesToCollection,
} from './parse-highways'
import { useSurfaceOsmQuery } from './surface-osm-query'

export function deriveSurfaceMapFeatures(
  graph: Parameters<typeof parseSurfaceFeaturesFromData>[0],
  bounds: MapBounds | undefined,
) {
  if (!bounds) return emptySurfaceCollection()
  return surfacesToCollection(parseSurfaceFeaturesFromData(graph, bounds))
}

export function useSurfaceMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const { data } = useSurfaceOsmQuery({
    select: (osmData) => deriveSurfaceMapFeatures(osmData.graph, bounds),
  })

  return data ?? emptySurfaceCollection()
}
