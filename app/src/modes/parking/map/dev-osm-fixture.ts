import { boundsToPolygon } from '@osm-editor-kit/osm-coverage'
import { parseOsmResp, type RawOsmData } from '@osm-editor-kit/osm-data'
import type { QueryClient } from '@tanstack/react-query'
import { isDevOsmFixtureActive } from '../../../shell/dev-osm-fixture-store'
import { DEV_OSM_FIXTURE_BBOX } from '../fixtures/dev-map-fixture.const'
import {
  emptyParkingOsmData,
  parkingOsmCoverageKey,
  parkingOsmSessionKey,
  type ParkingOsmQueryData,
} from './parking-osm-query'

const parkingSessionParams = {} as Record<never, never>

const devFixtureModules = import.meta.env.DEV
  ? import.meta.glob<RawOsmData>('../fixtures/dev-map-bbox.json', {
      import: 'default',
      eager: true,
    })
  : {}

function buildDevFixtureQueryData(): ParkingOsmQueryData | null {
  const raw = Object.values(devFixtureModules)[0]
  if (!raw) return null

  return {
    ...emptyParkingOsmData(),
    graph: parseOsmResp(raw),
    coverage: boundsToPolygon(DEV_OSM_FIXTURE_BBOX),
  }
}

/** Seeds the Berlin fixture into the parking OSM query when fixture mode is active. */
export function seedDevOsmFixture(queryClient: QueryClient): boolean {
  if (!isDevOsmFixtureActive()) return false

  const data = buildDevFixtureQueryData()
  if (!data) {
    console.warn(
      'Dev OSM fixture missing. Run `bun run dev` (predev) to download app/src/modes/parking/fixtures/dev-map-bbox.json.',
    )
    return false
  }

  queryClient.setQueryData(parkingOsmSessionKey(parkingSessionParams), data)
  queryClient.removeQueries({ queryKey: parkingOsmCoverageKey(parkingSessionParams) })
  return true
}

/** Drops seeded fixture data so live viewport fetches can repopulate the session. */
export function clearDevOsmFixtureSession(queryClient: QueryClient): void {
  queryClient.setQueryData(parkingOsmSessionKey(parkingSessionParams), emptyParkingOsmData())
  queryClient.removeQueries({ queryKey: parkingOsmCoverageKey(parkingSessionParams) })
}
