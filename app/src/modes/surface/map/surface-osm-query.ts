export {
  emptyOsmCoverageData as emptySurfaceOsmData,
  ensureOsmCoverage as ensureSurfaceOsmCoverage,
  osmCoverageFetchKey as surfaceOsmCoverageKey,
  osmCoverageSessionKey as surfaceOsmSessionKey,
  useIsOsmCoverageFetching as useIsSurfaceOsmFetching,
  useOsmCoverageQuery as useSurfaceOsmQuery,
  type OsmCoverageQueryData as SurfaceOsmQueryData,
} from '../../../shell/map/osm-coverage-query'

import { useOsmCoverageFetch } from '../../../shell/map/osm-coverage-query'

/** Surface-facing fetch API over the shared OSM Query storage. */
export function useSurfaceOsmFetch() {
  const { loadOsmData, refetchAfterSave, isFetching } = useOsmCoverageFetch()
  return {
    loadSurfaceData: loadOsmData,
    refetchAfterSave,
    isFetching,
  }
}
