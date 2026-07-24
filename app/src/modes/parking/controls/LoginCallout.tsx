import { Button } from '../../../components/catalyst/button'

export function LoginCallout(props: { onLogin: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-sm bg-zinc-950 px-3 py-2.5 text-white"
      role="status"
    >
      <p className="m-0 text-sm font-medium">Please log in to edit</p>
      <Button color="light" onClick={props.onLogin}>
        Log in
      </Button>
    </div>
  )
}
