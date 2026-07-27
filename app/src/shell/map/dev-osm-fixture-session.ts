import type { QueryClient } from '@tanstack/react-query'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageFetchKey,
  osmCoverageSessionKey,
} from './osm-coverage-query'

/** Drops seeded fixture data so live viewport fetches can repopulate the session. */
export function clearDevOsmFixtureSession(queryClient: QueryClient): void {
  const params = currentOsmSessionParams()
  queryClient.setQueryData(osmCoverageSessionKey(params), emptyOsmCoverageData())
  queryClient.removeQueries({ queryKey: osmCoverageFetchKey(params) })
}
