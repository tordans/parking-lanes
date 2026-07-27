import { catalogue } from '@osm-editor-kit/surface-smoothness-data'

export function PhotoAttributionFooter(props: { assetPaths: string[] }) {
  const entries = props.assetPaths
    .map((path) => catalogue.attribution.find((entry) => entry.file === path))
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)

  const unique = [...new Map(entries.map((entry) => [entry.file, entry])).values()]
  if (!unique.length) return null

  return (
    <footer className="mt-3 border-t border-zinc-200 pt-2 text-[10px] leading-snug text-zinc-500">
      {unique.map((entry) => (
        <p key={entry.file} className="m-0">
          Photo: {entry.source} ({entry.license})
        </p>
      ))}
    </footer>
  )
}
