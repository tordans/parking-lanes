import { useHighwayInclusionStyle } from '../../../shell/map/use-highway-inclusion-style'
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
  inclusionStyle: Parameters<typeof parseSurfaceFeaturesFromData>[2],
) {
  if (!bounds) return emptySurfaceCollection()
  return surfacesToCollection(parseSurfaceFeaturesFromData(graph, bounds, inclusionStyle))
}

export function useSurfaceMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const inclusionStyle = useHighwayInclusionStyle()
  const { data } = useSurfaceOsmQuery({
    select: (osmData) => deriveSurfaceMapFeatures(osmData.graph, bounds, inclusionStyle),
  })

  return data ?? emptySurfaceCollection()
}
