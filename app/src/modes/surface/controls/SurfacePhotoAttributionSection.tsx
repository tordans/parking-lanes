import * as m from '@app/paraglide/messages'
import { catalogue } from '@osm-editor-kit/surface-smoothness-data'

function AttributionSource({ source }: { source: string }) {
  const match = /^(https?:\/\/\S+)(?:\s+\((.+)\))?$/.exec(source)
  if (!match) return source

  const [, url, author] = match
  return (
    <>
      <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
        {url}
      </a>
      {author ? ` (${author})` : null}
    </>
  )
}

/** Full photo credits for the surface info panel (StreetComplete catalogue). */
export function SurfacePhotoAttributionSection() {
  const entries = catalogue.attribution
  if (!entries.length) return null

  return (
    <section className="py-4">
      <h3 className="mb-2 text-sm font-semibold text-zinc-900">{m.shell_photo_credits_title()}</h3>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[10px] leading-snug text-zinc-500">
        {entries.map((entry) => (
          <li key={entry.file} className="m-0">
            <AttributionSource source={entry.source} /> ({entry.license})
          </li>
        ))}
      </ul>
    </section>
  )
}
