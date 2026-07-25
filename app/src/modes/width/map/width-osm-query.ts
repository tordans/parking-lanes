export {
  emptyOsmCoverageData as emptyWidthOsmData,
  ensureOsmCoverage as ensureWidthOsmCoverage,
  osmCoverageFetchKey as widthOsmCoverageKey,
  osmCoverageSessionKey as widthOsmSessionKey,
  useIsOsmCoverageFetching as useIsWidthOsmFetching,
  useOsmCoverageQuery as useWidthOsmQuery,
  type OsmCoverageQueryData as WidthOsmQueryData,
} from '../../../shell/map/osm-coverage-query'

import { useOsmCoverageFetch } from '../../../shell/map/osm-coverage-query'

/** Width-facing fetch API over the shared OSM Query storage. */
export function useWidthOsmFetch() {
  const { loadOsmData, refetchAfterSave, isFetching } = useOsmCoverageFetch()
  return {
    loadWidthData: loadOsmData,
    refetchAfterSave,
    isFetching,
  }
}
