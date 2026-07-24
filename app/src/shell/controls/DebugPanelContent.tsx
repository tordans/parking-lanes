import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Checkbox, CheckboxField } from '../../components/catalyst/checkbox'
import { Label } from '../../components/catalyst/fieldset'
import { viewMinZoom } from '../../modes/parking/map/constants'
import {
  clearDevOsmFixtureSession,
  seedDevOsmFixture,
} from '../../modes/parking/map/dev-osm-fixture'
import { useParkingOsmFetch } from '../../modes/parking/map/parking-osm-query'
import { useMapBounds, useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'
import { useDebugSettingsActions, useUseOsmDevServer } from '../debug-settings-store'
import { useDevOsmFixtureActions, useLiveViewportOsmFetch } from '../dev-osm-fixture-store'
import { useMapViewport } from '../map/map-viewport'
import { serializeMapSearch } from '../map/search-schema'

export function DebugPanelContent() {
  const navigate = useNavigate({ from: '/' })
  const { debug } = useSearch({ from: '/' })
  const queryClient = useQueryClient()
  const osmDisplayName = useOsmDisplayName()
  const liveViewportOsmFetch = useLiveViewportOsmFetch()
  const useOsmDevServer = useUseOsmDevServer()
  const { setLiveViewportOsmFetch } = useDevOsmFixtureActions()
  const { setUseOsmDevServer } = useDebugSettingsActions()
  const mapBounds = useMapBounds()
  const { zoom: mapZoom } = useMapViewport()
  const { loadParkingData } = useParkingOsmFetch()
  const showCoverageDebug = canShowDebugToggle(osmDisplayName, debug)

  return (
    <div className="flex flex-col gap-4 p-1">
      {showCoverageDebug ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">OSM API</h3>
          <CheckboxField>
            <Checkbox
              checked={useOsmDevServer}
              onChange={(checked) => setUseOsmDevServer(checked)}
            />
            <Label>Use OSM dev server</Label>
          </CheckboxField>
          <p className="text-xs text-zinc-600">
            {useOsmDevServer
              ? 'OAuth and map API use api06.dev.openstreetmap.org (next login / fetch).'
              : 'OAuth and map API use production openstreetmap.org.'}
          </p>
        </section>
      ) : null}

      {import.meta.env.DEV === true ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">Dev OSM data</h3>
          <CheckboxField>
            <Checkbox
              checked={liveViewportOsmFetch}
              onChange={(checked) => {
                setLiveViewportOsmFetch(checked)
                if (checked) {
                  clearDevOsmFixtureSession(queryClient)
                  if (mapBounds && mapZoom >= viewMinZoom) {
                    void loadParkingData(mapBounds, mapZoom, { force: true })
                  }
                } else {
                  seedDevOsmFixture(queryClient)
                }
              }}
            />
            <Label>Live OSM viewport fetch</Label>
          </CheckboxField>
          <p className="text-xs text-zinc-600">
            {liveViewportOsmFetch
              ? 'OSM map API loads for the current viewport (fixture off).'
              : 'Local Berlin fixture — no OSM map API on startup.'}
          </p>
        </section>
      ) : null}

      {showCoverageDebug ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">Coverage</h3>
          <CheckboxField>
            <Checkbox
              checked={debug === true}
              onChange={(checked) => {
                void navigate({
                  search: (prev) => ({
                    ...serializeMapSearch(prev),
                    debug: checked ? true : undefined,
                  }),
                })
              }}
            />
            <Label>Coverage debug</Label>
          </CheckboxField>
          <p className="text-xs text-zinc-600">
            Show fetch coverage polygons on the map and details on hover.
          </p>
        </section>
      ) : null}
    </div>
  )
}
