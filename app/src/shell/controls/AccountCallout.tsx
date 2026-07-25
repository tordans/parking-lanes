import { Button } from '../../components/catalyst/button'
import { useOsmAuth } from '../../modes/parking/map/use-osm-auth'
import { AuthState, useAuthState, useOsmDisplayName } from '../app-store'
import { AccountCalloutBar } from './AccountCalloutBar'

export function AccountCallout() {
  const authState = useAuthState()
  const osmDisplayName = useOsmDisplayName()
  const { login, logout } = useOsmAuth()

  if (authState === AuthState.success) {
    return (
      <AccountCalloutBar
        message={
          <p className="m-0 min-w-0 text-sm font-medium">
            Signed in as {osmDisplayName ?? 'OpenStreetMap user'}
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
    authState === AuthState.fail ? 'Log in failed — try again' : 'Please log in to edit'

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
