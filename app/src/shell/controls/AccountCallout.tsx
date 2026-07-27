import * as m from '@app/paraglide/messages'
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
  const serverLabel = useOsmDevServer ? m.account_osm_dev() : m.account_osm()

  if (authState === AuthState.success) {
    return (
      <AccountCalloutBar
        message={
          <p className="m-0 min-w-0 text-sm font-medium">
            {m.account_signed_in_as({
              name: osmDisplayName ?? 'OpenStreetMap user',
            })}
            {useOsmDevServer ? (
              <span className="mt-0.5 block text-xs font-normal text-amber-800">
                {m.account_uploads_dev_server()}
              </span>
            ) : null}
          </p>
        }
        action={
          <Button color="light" onClick={logout}>
            {m.account_log_out()}
          </Button>
        }
      />
    )
  }

  const loginMessage =
    authState === AuthState.fail
      ? m.account_login_failed({ server: serverLabel })
      : m.account_login_prompt({ server: serverLabel })

  return (
    <AccountCalloutBar
      message={<p className="m-0 text-sm font-medium">{loginMessage}</p>}
      action={
        <Button color="light" onClick={() => void login()}>
          {m.account_log_in()}
        </Button>
      }
    />
  )
}
