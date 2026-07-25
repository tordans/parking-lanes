import { boundsToPolygon } from '@osm-editor-kit/osm-coverage'
import { parseOsmResp, type RawOsmData } from '@osm-editor-kit/osm-data'
import type { QueryClient } from '@tanstack/react-query'
import { DEV_OSM_FIXTURE_BBOX } from '../../modes/parking/fixtures/dev-map-fixture.const'
import { isDevOsmFixtureActive } from '../dev-osm-fixture-store'
import {
  currentOsmSessionParams,
  emptyOsmCoverageData,
  osmCoverageFetchKey,
  osmCoverageSessionKey,
  type OsmCoverageQueryData,
} from './osm-coverage-query'

const devFixtureModules = import.meta.env.DEV
  ? import.meta.glob<RawOsmData>('../../modes/parking/fixtures/dev-map-bbox.json', {
      import: 'default',
      eager: true,
    })
  : {}

function buildDevFixtureQueryData(): OsmCoverageQueryData | null {
  const raw = Object.values(devFixtureModules)[0]
  if (!raw) return null

  return {
    ...emptyOsmCoverageData(),
    graph: parseOsmResp(raw),
    coverage: boundsToPolygon(DEV_OSM_FIXTURE_BBOX),
  }
}

/** Seeds the Berlin fixture into the shared OSM Query when fixture mode is active. */
export function seedDevOsmFixture(queryClient: QueryClient): boolean {
  if (!isDevOsmFixtureActive()) return false

  const data = buildDevFixtureQueryData()
  if (!data) {
    console.warn(
      'Dev OSM fixture missing. Run `bun run dev` (predev) to download app/src/modes/parking/fixtures/dev-map-bbox.json.',
    )
    return false
  }

  const params = currentOsmSessionParams()
  queryClient.setQueryData(osmCoverageSessionKey(params), data)
  queryClient.removeQueries({ queryKey: osmCoverageFetchKey(params) })
  return true
}

/** Drops seeded fixture data so live viewport fetches can repopulate the session. */
export function clearDevOsmFixtureSession(queryClient: QueryClient): void {
  const params = currentOsmSessionParams()
  queryClient.setQueryData(osmCoverageSessionKey(params), emptyOsmCoverageData())
  queryClient.removeQueries({ queryKey: osmCoverageFetchKey(params) })
}
