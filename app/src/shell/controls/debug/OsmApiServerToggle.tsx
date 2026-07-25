import { useQueryClient } from '@tanstack/react-query'
import { Checkbox, CheckboxField } from '../../../components/catalyst/checkbox'
import { Label } from '../../../components/catalyst/fieldset'
import { logout } from '../../../lib/osm-client'
import { toast } from '../../../lib/toast'
import { clearChanges } from '../../../utils/changes-store'
import { AuthState, useAppActions, useAuthState } from '../../app-store'
import { useDebugSettingsActions, useUseOsmDevServer } from '../../debug-settings-store'
import { clearOsmCoverageSessions } from '../../map/osm-coverage-query'

export function OsmApiServerToggle() {
  const queryClient = useQueryClient()
  const authState = useAuthState()
  const useOsmDevServer = useUseOsmDevServer()
  const { setUseOsmDevServer } = useDebugSettingsActions()
  const { setAuthState, setOsmDisplayName } = useAppActions()

  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-zinc-900">OSM API</h4>
      <CheckboxField>
        <Checkbox
          checked={useOsmDevServer}
          onChange={(checked) => {
            setUseOsmDevServer(checked)
            clearChanges()
            clearOsmCoverageSessions(queryClient)
            if (authState === AuthState.success) {
              logout()
              setAuthState(AuthState.initial)
              setOsmDisplayName(null)
              toast.message(
                checked
                  ? 'Switched to OSM dev server — sign in again before uploading.'
                  : 'Switched to OSM production — sign in again before uploading.',
              )
            }
          }}
        />
        <Label>Use OSM dev server</Label>
      </CheckboxField>
      <p className="text-xs text-zinc-600">
        {useOsmDevServer
          ? 'Map fetch, OAuth, and uploads use master.apis.dev.openstreetmap.org. Requires a separate login.'
          : 'Map fetch, OAuth, and uploads use api.openstreetmap.org (production).'}
      </p>
    </section>
  )
}
