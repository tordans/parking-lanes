export {
  emptyOsmCoverageData as emptyLanesOsmData,
  ensureOsmCoverage as ensureLanesOsmCoverage,
  osmCoverageFetchKey as lanesOsmCoverageKey,
  osmCoverageSessionKey as lanesOsmSessionKey,
  useIsOsmCoverageFetching as useIsLanesOsmFetching,
  useOsmCoverageQuery as useLanesOsmQuery,
  type OsmCoverageQueryData as LanesOsmQueryData,
} from '../../../shell/map/osm-coverage-query'

import { useOsmCoverageFetch } from '../../../shell/map/osm-coverage-query'

export function useLanesOsmFetch() {
  const { loadOsmData, refetchAfterSave, isFetching } = useOsmCoverageFetch()
  return {
    loadLanesData: loadOsmData,
    refetchAfterSave,
    isFetching,
  }
}
