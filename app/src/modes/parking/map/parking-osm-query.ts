export {
  emptyOsmCoverageData as emptyParkingOsmData,
  ensureOsmCoverage as ensureParkingOsmCoverage,
  osmCoverageFetchKey as parkingOsmCoverageKey,
  osmCoverageSessionKey as parkingOsmSessionKey,
  useIsOsmCoverageFetching as useIsParkingOsmFetching,
  useOsmCoverageQuery as useParkingOsmQuery,
  type OsmCoverageQueryData as ParkingOsmQueryData,
} from '../../../shell/map/osm-coverage-query'

import { useOsmCoverageFetch } from '../../../shell/map/osm-coverage-query'

/** Parking-facing fetch API over the shared OSM Query storage. */
export function useParkingOsmFetch() {
  const { loadOsmData, refetchAfterSave, isFetching } = useOsmCoverageFetch()
  return {
    loadParkingData: loadOsmData,
    refetchAfterSave,
    isFetching,
  }
}
