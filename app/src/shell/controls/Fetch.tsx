import { OsmDataSource } from '@osm-editor-kit/osm-coverage'
import { useState } from 'react'
import { Button, TouchTarget } from '../../components/catalyst/button'
import { assetUrl } from '../../utils/asset-url'
import { useAppActions, useFetchButtonText, useOsmDataSource } from '../app-store'

export function FetchButton(props: { onClick: () => void }) {
  const [sourcesShown, setSourcesShown] = useState(false)
  const fetchButtonText = useFetchButtonText()
  const dataSource = useOsmDataSource()
  const { setOsmDataSource } = useAppActions()

  return (
    <div
      className="relative"
      tabIndex={-1}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setSourcesShown(false)
        }
      }}
    >
      <div className="flex overflow-hidden rounded-lg ring-1 ring-zinc-950/10">
        <Button color="light" className="rounded-none! border-0!" onClick={props.onClick}>
          <img
            data-slot="icon"
            src={assetUrl('assets/icons/download.svg')}
            width={16}
            height={16}
            alt=""
          />
          <span className="max-sm:hidden">{fetchButtonText}</span>
        </Button>
        <Button
          color="light"
          className="rounded-none! border-0! border-l! border-zinc-950/10!"
          aria-label="Select data source"
          onClick={() => setSourcesShown(!sourcesShown)}
        >
          <TouchTarget>{sourcesShown ? '△' : '▽'}</TouchTarget>
        </Button>
      </div>
      {sourcesShown && (
        <Sources
          source={dataSource}
          onChangeSource={(source) => {
            setSourcesShown(false)
            setOsmDataSource(source)
          }}
        />
      )}
    </div>
  )
}

function Sources(props: {
  source: OsmDataSource
  onChangeSource: (source: OsmDataSource) => void
}) {
  const sources = [
    { source: OsmDataSource.OverpassDe, label: 'overpass-turbo' },
    { source: OsmDataSource.OsmOrg, label: 'osm.org' },
    { source: OsmDataSource.OverpassVk, label: 'overpass-vk' },
  ]

  return (
    <div className="absolute top-full right-0 z-20 mt-1 min-w-full overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-zinc-950/10">
      {sources.map((x) => (
        <button
          key={x.source}
          type="button"
          className={`block w-full cursor-pointer px-3 py-1.5 text-left text-sm whitespace-nowrap hover:bg-zinc-950/5 ${
            x.source === props.source ? 'bg-zinc-950/5 font-medium' : ''
          }`}
          onClick={() => props.onChangeSource(x.source)}
        >
          From {x.label}
        </button>
      ))}
    </div>
  )
}
