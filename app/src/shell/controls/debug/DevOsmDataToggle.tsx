import { useQueryClient } from '@tanstack/react-query'
import { Checkbox, CheckboxField } from '../../../components/catalyst/checkbox'
import { Label } from '../../../components/catalyst/fieldset'
import { viewMinZoom } from '../../../modes/parking/map/constants'
import { useMapBounds } from '../../app-store'
import { useDevOsmFixtureActions, useLiveViewportOsmFetch } from '../../dev-osm-fixture-store'
import { clearDevOsmFixtureSession } from '../../map/dev-osm-fixture-session'
import { useMapViewport } from '../../map/map-viewport'
import { useOsmCoverageFetch } from '../../map/osm-coverage-query'

export function DevOsmDataToggle() {
  const queryClient = useQueryClient()
  const liveViewportOsmFetch = useLiveViewportOsmFetch()
  const { setLiveViewportOsmFetch } = useDevOsmFixtureActions()
  const mapBounds = useMapBounds()
  const { zoom: mapZoom } = useMapViewport()
  const { loadOsmData } = useOsmCoverageFetch()

  if (import.meta.env.DEV !== true) return null

  return (
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
              void import('../../map/dev-osm-fixture-seed').then(({ seedDevOsmFixture }) =>
                seedDevOsmFixture(queryClient),
              )
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
  )
}
