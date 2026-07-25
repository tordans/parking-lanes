import { useOsmDisplayName } from '../../app-store'
import { DEBUG_USERS } from '../../debug'

export function DebugUsersList() {
  const osmDisplayName = useOsmDisplayName()

  return (
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
  )
}
