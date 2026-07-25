import type { CoverageFetchProps } from '@osm-editor-kit/osm-coverage'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { Layer, Source } from 'react-map-gl/maplibre'
import { coverageFetchFillPaint, coverageFetchLinePaint } from './coverage-layer-paint'

export const coverageDebugFetchFillLayerId = 'coverage-debug-fetch-fill'
export const coverageDebugFetchLineLayerId = 'coverage-debug-fetch-line'

export type StyledFetchProps = CoverageFetchProps & {
  color: string
  highlighted: number
}

export function CoverageFetchHistorySource({
  collection,
}: {
  collection: FeatureCollection<Polygon, StyledFetchProps>
}) {
  if (!collection.features.length) return null

  return (
    <Source id="coverage-debug-fetch-source" type="geojson" data={collection}>
      <Layer id={coverageDebugFetchFillLayerId} type="fill" paint={coverageFetchFillPaint} />
      <Layer id={coverageDebugFetchLineLayerId} type="line" paint={coverageFetchLinePaint} />
    </Source>
  )
}

export function styleFetchHistory(
  fetchHistory: FeatureCollection<Polygon, CoverageFetchProps> | undefined,
  hoveredGroupId: string | null,
  colorForGroupId: (groupId: string) => string,
): FeatureCollection<Polygon, StyledFetchProps> {
  if (!fetchHistory?.features.length) {
    return { type: 'FeatureCollection', features: [] }
  }

  return {
    type: 'FeatureCollection',
    features: fetchHistory.features.map((feature): Feature<Polygon, StyledFetchProps> => {
      const groupId = feature.properties.groupId
      return {
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          ...feature.properties,
          color: colorForGroupId(groupId),
          highlighted: hoveredGroupId === groupId ? 1 : 0,
        },
      }
    }),
  }
}
