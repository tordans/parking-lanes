import type { TagChange } from '@osm-editor-kit/osm-changeset'

export function PendingTagDiff(props: { tagChanges: TagChange[] }) {
  if (props.tagChanges.length === 0) {
    return <p className="mt-2 text-xs text-zinc-500">Geometry change (no tag edits)</p>
  }

  return (
    <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
      {props.tagChanges.map((tag) => (
        <li key={tag.key} className="break-all">
          <span className="text-zinc-500">{tag.key}=</span>
          {tag.from === null ? (
            <span className="text-emerald-700">{tag.to}</span>
          ) : tag.to === null ? (
            <span className="text-red-700 line-through">{tag.from}</span>
          ) : (
            <>
              <span className="text-red-700 line-through">{tag.from}</span>
              <span className="text-zinc-400"> → </span>
              <span className="text-emerald-700">{tag.to}</span>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
