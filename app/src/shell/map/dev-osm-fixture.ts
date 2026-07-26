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

/**
 * URL-only glob — do not import the JSON as a Vite module (`?import`).
 * Transforming ~50MB JSON into a JS module balloons to hundreds of MB over the wire.
 */
const fixtureUrlByPath = import.meta.env.DEV
  ? import.meta.glob<string>('../../modes/parking/fixtures/dev-map-bbox.json', {
      query: '?url',
      import: 'default',
      eager: true,
    })
  : {}

async function loadDevFixtureRaw(): Promise<RawOsmData | null> {
  const url = Object.values(fixtureUrlByPath)[0]
  if (!url) return null

  const response = await fetch(url)
  if (!response.ok) return null
  return (await response.json()) as RawOsmData
}

async function buildDevFixtureQueryData(): Promise<OsmCoverageQueryData | null> {
  const raw = await loadDevFixtureRaw()
  if (!raw) return null

  return {
    ...emptyOsmCoverageData(),
    graph: parseOsmResp(raw),
    coverage: boundsToPolygon(DEV_OSM_FIXTURE_BBOX),
  }
}

/** Seeds the Berlin fixture into the shared OSM Query when fixture mode is active. */
export async function seedDevOsmFixture(queryClient: QueryClient): Promise<boolean> {
  if (!isDevOsmFixtureActive()) return false

  const data = await buildDevFixtureQueryData()
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
