import { Button } from '../../components/catalyst/button'
import { useOsmAuth } from '../../modes/parking/map/use-osm-auth'
import { AuthState, useAuthState, useOsmDisplayName } from '../app-store'
import { useUseOsmDevServer } from '../debug-settings-store'
import { AccountCalloutBar } from './AccountCalloutBar'

export function AccountCallout() {
  const authState = useAuthState()
  const osmDisplayName = useOsmDisplayName()
  const useOsmDevServer = useUseOsmDevServer()
  const { login, logout } = useOsmAuth()
  const serverLabel = useOsmDevServer ? 'OSM dev' : 'OSM'

  if (authState === AuthState.success) {
    return (
      <AccountCalloutBar
        message={
          <p className="m-0 min-w-0 text-sm font-medium">
            Signed in as {osmDisplayName ?? 'OpenStreetMap user'}
            {useOsmDevServer ? (
              <span className="mt-0.5 block text-xs font-normal text-amber-800">
                Uploads go to the OSM dev server
              </span>
            ) : null}
          </p>
        }
        action={
          <Button color="light" onClick={logout}>
            Log out
          </Button>
        }
      />
    )
  }

  const loginMessage =
    authState === AuthState.fail
      ? `Log in to ${serverLabel} failed — try again`
      : `Please log in to ${serverLabel} to edit`

  return (
    <AccountCalloutBar
      message={<p className="m-0 text-sm font-medium">{loginMessage}</p>}
      action={
        <Button color="light" onClick={() => void login()}>
          Log in
        </Button>
      }
    />
  )
}
