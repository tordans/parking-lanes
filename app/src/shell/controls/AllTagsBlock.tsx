import * as m from '@app/paraglide/messages'
import { type OsmTags } from '@osm-editor-kit/osm-data'
import { useAllTagsActions, useAllTagsOpen } from './all-tags-store'

export function AllTagsBlock(props: {
  tags: OsmTags
  /** Bold keys that start with this prefix (e.g. `parking:`). */
  highlightKeyPrefix?: string
}) {
  const allTagsOpen = useAllTagsOpen()
  const { setAllTagsOpen } = useAllTagsActions()
  const highlightPrefix = props.highlightKeyPrefix

  return (
    <details
      className="pt-1.5 text-sm text-zinc-600"
      open={allTagsOpen}
      onToggle={(event) => setAllTagsOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-sans">{m.panel_all_tags()}</summary>
      <table className="w-full table-fixed font-mono">
        <colgroup>
          <col className="w-1/2" />
          <col className="w-1/2" />
        </colgroup>
        <tbody>
          {Object.keys(props.tags).map((tag) => (
            <tr
              key={tag}
              className={`hover:bg-zinc-950/5 ${
                highlightPrefix && tag.startsWith(highlightPrefix) ? 'font-semibold' : ''
              }`}
            >
              <td className="break-all pr-2 align-top">{tag}</td>
              <td className="break-all align-top">{props.tags[tag]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
