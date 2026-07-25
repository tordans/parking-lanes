import type { CoverageFetchProps } from '@osm-editor-kit/osm-coverage'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { useMemo } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'
import { colorForGroupId } from '../debug'
import { useOsmCoverageQuery } from '../map/osm-coverage-query'

export const coverageDebugFetchFillLayerId = 'coverage-debug-fetch-fill'
export const coverageDebugFetchLineLayerId = 'coverage-debug-fetch-line'

type StyledFetchProps = CoverageFetchProps & {
  color: string
  highlighted: number
}

const emptyStyledFetchHistory = (): FeatureCollection<Polygon, StyledFetchProps> => ({
  type: 'FeatureCollection',
  features: [],
})

export function CoverageDebugLayers({ hoveredGroupId }: { hoveredGroupId: string | null }) {
  const { data: coverage } = useOsmCoverageQuery({ select: (data) => data.coverage })
  const { data: fetchHistory } = useOsmCoverageQuery({ select: (data) => data.fetchHistory })

  const styledFetchHistory = useMemo((): FeatureCollection<Polygon, StyledFetchProps> => {
    if (!fetchHistory?.features.length) return emptyStyledFetchHistory()

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
  }, [fetchHistory, hoveredGroupId])

  const coverageCollection = useMemo((): FeatureCollection<Polygon | MultiPolygon> => {
    if (!coverage) return { type: 'FeatureCollection', features: [] }
    return { type: 'FeatureCollection', features: [coverage] }
  }, [coverage])

  return (
    <>
      <Source id="coverage-debug-coverage-source" type="geojson" data={coverageCollection}>
        <Layer
          id="coverage-debug-coverage-line"
          type="line"
          paint={{
            'line-color': '#475569',
            'line-width': 1.5,
            'line-opacity': 0.45,
            'line-dasharray': [2, 2],
          }}
        />
      </Source>
      <Source id="coverage-debug-fetch-source" type="geojson" data={styledFetchHistory}>
        <Layer
          id={coverageDebugFetchFillLayerId}
          type="fill"
          paint={{
            'fill-color': ['get', 'color'],
            'fill-opacity': ['case', ['==', ['get', 'highlighted'], 1], 0.45, 0.22],
          }}
        />
        <Layer
          id={coverageDebugFetchLineLayerId}
          type="line"
          paint={{
            'line-color': ['get', 'color'],
            'line-width': ['case', ['==', ['get', 'highlighted'], 1], 2.5, 1.25],
            'line-opacity': ['case', ['==', ['get', 'highlighted'], 1], 1, 0.85],
          }}
        />
      </Source>
    </>
  )
}
