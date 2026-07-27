import * as m from '@app/paraglide/messages'
import { Button } from '../../../components/catalyst/button'
import { AccountCalloutBar } from '../../../shell/controls/AccountCalloutBar'

export function LoginCallout(props: { onLogin: () => void }) {
  return (
    <AccountCalloutBar
      message={<p className="m-0 text-sm font-medium">{m.editor_please_login()}</p>}
      action={
        <Button color="light" onClick={props.onLogin}>
          {m.account_log_in()}
        </Button>
      }
    />
  )
}
