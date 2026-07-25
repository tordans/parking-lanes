import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { colorForGroupId } from '../debug'
import { useOsmCoverageQuery } from '../map/osm-coverage-query'
import { CoverageFetchHistorySource, styleFetchHistory } from './CoverageFetchHistorySource'
import { CoverageOutlineSource } from './CoverageOutlineSource'

export {
  coverageDebugFetchFillLayerId,
  coverageDebugFetchLineLayerId,
} from './CoverageFetchHistorySource'

export function CoverageDebugLayers({ hoveredGroupId }: { hoveredGroupId: string | null }) {
  const { data: coverage } = useOsmCoverageQuery({ select: (data) => data.coverage })
  const { data: fetchHistory } = useOsmCoverageQuery({ select: (data) => data.fetchHistory })

  const styledFetchHistory = styleFetchHistory(fetchHistory, hoveredGroupId, colorForGroupId)

  const coverageCollection: FeatureCollection<Polygon | MultiPolygon> = coverage
    ? { type: 'FeatureCollection', features: [coverage] }
    : { type: 'FeatureCollection', features: [] }

  return (
    <>
      <CoverageOutlineSource collection={coverageCollection} />
      <CoverageFetchHistorySource collection={styledFetchHistory} />
    </>
  )
}
