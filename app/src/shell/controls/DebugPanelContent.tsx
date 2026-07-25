import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Checkbox, CheckboxField } from '../../components/catalyst/checkbox'
import { Label } from '../../components/catalyst/fieldset'
import { viewMinZoom } from '../../modes/parking/map/constants'
import { useMapBounds, useOsmDisplayName } from '../app-store'
import {
  DEBUG_USERS,
  debugUserSettingsHeaderClassName,
  debugUserSettingsHeaderStyle,
  debugUserSettingsSectionClassName,
  debugUserSettingsSectionStyle,
} from '../debug'
import { useDebugSettingsActions, useUseOsmDevServer } from '../debug-settings-store'
import { useDevOsmFixtureActions, useLiveViewportOsmFetch } from '../dev-osm-fixture-store'
import { clearDevOsmFixtureSession, seedDevOsmFixture } from '../map/dev-osm-fixture'
import { useMapViewport } from '../map/map-viewport'
import { useOsmCoverageFetch } from '../map/osm-coverage-query'
import { serializeMapSearch } from '../map/search-schema'

export function DebugUserSettingsSection() {
  const navigate = useNavigate({ from: '/{-$mode}' })
  const { debug } = useSearch({ from: '/{-$mode}' })
  const queryClient = useQueryClient()
  const osmDisplayName = useOsmDisplayName()
  const liveViewportOsmFetch = useLiveViewportOsmFetch()
  const useOsmDevServer = useUseOsmDevServer()
  const { setLiveViewportOsmFetch } = useDevOsmFixtureActions()
  const { setUseOsmDevServer } = useDebugSettingsActions()
  const mapBounds = useMapBounds()
  const { zoom: mapZoom } = useMapViewport()
  const { loadOsmData } = useOsmCoverageFetch()

  return (
    <section
      aria-label="Debug user settings"
      className={debugUserSettingsSectionClassName()}
      style={debugUserSettingsSectionStyle()}
    >
      <div className={debugUserSettingsHeaderClassName()} style={debugUserSettingsHeaderStyle()}>
        Debug user settings
      </div>
      <div className="flex flex-col gap-4 px-2 py-1.5">
        <section className="flex flex-col gap-1">
          <h4 className="text-xs font-semibold text-zinc-900">Debug users</h4>
          <ul className="list-inside list-disc text-xs text-zinc-700">
            {DEBUG_USERS.map((user) => (
              <li
                key={user}
                className={user === osmDisplayName ? 'font-semibold text-zinc-950' : undefined}
              >
                {user}
                {user === osmDisplayName ? ' (you)' : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-zinc-900">OSM API</h4>
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

        {import.meta.env.DEV === true ? (
          <section className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-zinc-900">Dev OSM data</h4>
            <CheckboxField>
              <Checkbox
                checked={liveViewportOsmFetch}
                onChange={(checked) => {
                  setLiveViewportOsmFetch(checked)
                  if (checked) {
                    clearDevOsmFixtureSession(queryClient)
                    if (mapBounds && mapZoom >= viewMinZoom) {
                      void loadOsmData(mapBounds, mapZoom, { force: true })
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
                ? 'OSM map API loads for the current viewport (fixture off). Shared by all modes.'
                : 'Local Berlin fixture — no OSM map API on startup. Shared by all modes.'}
            </p>
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold text-zinc-900">Coverage</h4>
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
      </div>
    </section>
  )
}
