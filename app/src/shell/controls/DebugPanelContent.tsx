import { useNavigate, useSearch } from '@tanstack/react-router'
import { Checkbox, CheckboxField } from '../../components/catalyst/checkbox'
import { Label } from '../../components/catalyst/fieldset'
import { useOsmDisplayName } from '../app-store'
import { canShowDebugToggle } from '../debug'
import { useDevOsmFixtureActions, useLiveViewportOsmFetch } from '../dev-osm-fixture-store'
import { serializeMapSearch } from '../map/search-schema'

export function DebugPanelContent() {
  const navigate = useNavigate({ from: '/' })
  const { debug } = useSearch({ from: '/' })
  const osmDisplayName = useOsmDisplayName()
  const liveViewportOsmFetch = useLiveViewportOsmFetch()
  const { setLiveViewportOsmFetch } = useDevOsmFixtureActions()
  const showCoverageDebug = canShowDebugToggle(osmDisplayName, debug)

  return (
    <div className="flex flex-col gap-4 p-1">
      {import.meta.env.DEV ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-zinc-900">Dev OSM data</h3>
          <CheckboxField>
            <Checkbox checked={liveViewportOsmFetch} onChange={setLiveViewportOsmFetch} />
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
