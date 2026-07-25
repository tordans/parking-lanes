import { Trash2 } from 'lucide-react'
import type { PendingChange } from '../../../utils/changes-store'
import { orderedChangeSources, wayHasStreetName } from '../../../utils/changeset-message'
import { ChangeSourceIcon } from './ChangeSourceIcon'
import { PendingTagDiff } from './PendingTagDiff'

export function PendingChangesList(props: {
  pending: PendingChange[]
  onDiscard: (wayId: number) => void
}) {
  return (
    <ul className="max-h-64 space-y-3 overflow-auto rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-950/5">
      {props.pending.map((change) => (
        <li key={change.way.id} className="rounded-md bg-white p-3 ring-1 ring-zinc-950/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="truncate font-medium text-zinc-950">
                way/{change.way.id}
                {wayHasStreetName(change.way) ? (
                  <span className="font-normal text-zinc-500"> · {change.displayName}</span>
                ) : null}
              </div>
              {change.sources.length > 0 ? (
                <div className="flex shrink-0 items-center gap-1">
                  {orderedChangeSources(change.sources).map((source) => (
                    <ChangeSourceIcon key={source} source={source} />
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label={`Remove way/${change.way.id}`}
              className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-700"
              onClick={() => props.onDiscard(change.way.id)}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
          <PendingTagDiff tagChanges={change.tagChanges} />
        </li>
      ))}
    </ul>
  )
}
