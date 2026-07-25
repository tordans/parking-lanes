import { Button } from '../../../components/catalyst/button'
import { AccountCalloutBar } from '../../../shell/controls/AccountCalloutBar'

export function LoginCallout(props: { onLogin: () => void }) {
  return (
    <AccountCalloutBar
      message={<p className="m-0 text-sm font-medium">Please log in to edit</p>}
      action={
        <Button color="light" onClick={props.onLogin}>
          Log in
        </Button>
      }
    />
  )
}
