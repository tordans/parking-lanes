import { useHighwayInclusionStyle } from '../../../shell/map/use-highway-inclusion-style'
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
  inclusionStyle: Parameters<typeof parseHighwayFeaturesFromData>[2],
) {
  if (!bounds) return emptyHighwayCollection()
  return highwaysToCollection(parseHighwayFeaturesFromData(graph, bounds, inclusionStyle))
}

export function useWidthMapFeatures({ bounds }: { bounds: MapBounds | undefined }) {
  const inclusionStyle = useHighwayInclusionStyle()
  const { data } = useWidthOsmQuery({
    select: (osmData) => deriveWidthMapFeatures(osmData.graph, bounds, inclusionStyle),
  })

  return data ?? emptyHighwayCollection()
}
