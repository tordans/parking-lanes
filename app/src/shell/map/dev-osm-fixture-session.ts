import type { QueryClient } from '@tanstack/react-query'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageFetchKey,
  osmCoverageSessionKey,
} from './osm-coverage-query'

/** Clears the OSM session so the next viewport fetch (fixture or live) repopulates it. */
export function clearDevOsmFixtureSession(queryClient: QueryClient): void {
  const params = currentOsmSessionParams()
  queryClient.setQueryData(osmCoverageSessionKey(params), emptyOsmCoverageData())
  queryClient.removeQueries({ queryKey: osmCoverageFetchKey(params) })
}
